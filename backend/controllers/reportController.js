import { supabase } from '../config/supabase.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Helper to format branch name with short code in reports
const getBranchFormatter = async () => {
  const { data: dbBranches } = await supabase.from('branches').select('*');
  const branchMap = {};
  if (dbBranches) {
    dbBranches.forEach(b => {
      branchMap[b.branch_name.toUpperCase()] = `${b.branch_name} (${b.branch_code})`;
      branchMap[b.branch_code.toUpperCase()] = `${b.branch_name} (${b.branch_code})`;
    });
  }
  return (name) => {
    if (!name) return 'N/A';
    return branchMap[name.toUpperCase()] || name;
  };
};

// Helper to query report data based on type
const fetchReportData = async (type, gender) => {
  switch (type) {
    case 'merit': {
      let q = supabase
        .from('merit_list')
        .select('rank, marks, status, students!inner(student_name, branch, category, gender, percentage)')
        .order('rank', { ascending: true });
      if (gender) {
        q = q.eq('students.gender', gender);
      }
      return await q;
    }
    case 'allotment': {
      let q = supabase
        .from('allotments')
        .select('seat_number, status, room_id, students!inner(id, student_name, branch, category, gender, percentage), hostels(hostel_name, building), rooms(room_number)')
        .eq('status', 'Active');
      if (gender) {
        q = q.eq('students.gender', gender);
      }
      const { data: allotmentsData, error } = await q;
      if (error) return { data: null, error };

      // Fetch merit_list entries to attach exact rank and marks
      const { data: meritData } = await supabase
        .from('merit_list')
        .select('student_id, rank, marks');
      
      const meritMap = {};
      if (meritData) {
        meritData.forEach(m => {
          meritMap[m.student_id] = m;
        });
      }

      const combined = (allotmentsData || []).map(a => {
        const student = a.students || {};
        const m = meritMap[student.id] || {};
        const pct = m.marks !== undefined && m.marks !== null ? m.marks : (student.percentage || 0);
        return {
          ...a,
          rank: m.rank || 0,
          marks: pct
        };
      });

      // Sort allotments strictly by rank ASC (Highest Percentage -> Lowest Percentage)
      combined.sort((a, b) => {
        if (a.rank && b.rank) return a.rank - b.rank;
        const pctA = parseFloat(a.marks || 0);
        const pctB = parseFloat(b.marks || 0);
        return pctB - pctA;
      });

      return { data: combined, error: null };
    }
    case 'waiting': {
      let q = supabase
        .from('waiting_list')
        .select('reason, students!inner(student_name, branch, category, percentage, gender)');
      if (gender) {
        q = q.eq('students.gender', gender);
      }
      return await q;
    }
    case 'branch': {
      let q = supabase
        .from('students')
        .select('branch, gender, merit_list(status)')
        .neq('nashik_municipal_corporation', 'Yes');
      if (gender) {
        q = q.eq('gender', gender);
      }
      return await q;
    }
    case 'category': {
      let q = supabase
        .from('students')
        .select('category, gender, merit_list(status)')
        .neq('nashik_municipal_corporation', 'Yes');
      if (gender) {
        q = q.eq('gender', gender);
      }
      return await q;
    }
    case 'occupancy': {
      let q = supabase
        .from('hostels')
        .select('hostel_name, gender, building, capacity, occupied')
        .order('hostel_name', { ascending: true });
      if (gender) {
        q = q.eq('gender', gender === 'Male' ? 'Male' : 'Female');
      }
      return await q;
    }
    default:
      throw new Error('Invalid report type.');
  }
};
// Helper to format full branch name without short code in reports
const getFullBranchFormatter = async () => {
  const { data: dbBranches } = await supabase.from('branches').select('*');
  const branchMap = {};
  if (dbBranches) {
    dbBranches.forEach(b => {
      branchMap[b.branch_name.toUpperCase()] = b.branch_name;
      branchMap[b.branch_code.toUpperCase()] = b.branch_name;
    });
  }
  return (name) => {
    if (!name) return 'N/A';
    return branchMap[name.toUpperCase()] || name;
  };
};

export const generatePdfReport = async (req, res, next) => {
  try {
    const { type, gender } = req.query;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Report type parameter is required.' });
    }

    const formatFullBranch = await getFullBranchFormatter();

    const { data, error } = await fetchReportData(type, gender);
    if (error) throw error;

    // Report Title
    let reportName = 'REPORT';
    if (type === 'merit') reportName = 'ACADEMIC MERIT LIST REPORT';
    else if (type === 'allotment') reportName = 'HOSTEL SEAT ALLOTMENTS REPORT';
    else if (type === 'occupancy') reportName = 'HOSTEL SEAT OCCUPANCY REPORT';
    else reportName = `${type.toUpperCase()} REPORT`;

    if (gender) {
      reportName += ` (${gender.toUpperCase()} CATEGORY)`;
    }

    // Timestamp
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateTimeStr = `Generated Date & Time: ${formattedDate}, ${formattedTime}`;

    // PDFKit Document setup with page buffering for page numbers
    const doc = new PDFDocument({ margin: 35, size: 'A4', bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${type}.pdf`);
    doc.pipe(res);

    const startX = 35;
    const tableWidth = 525;

    // Draw Page Header Banner
    const drawPageHeader = () => {
      doc.save();
      doc.rect(startX, 35, tableWidth, 4).fill('#4C1D95');

      doc.font('Helvetica-Bold').fontSize(15).fillColor('#1E1B4B').text('Government Polytechnic Nashik', startX, 45, { align: 'center', width: tableWidth });
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#5B21B6').text('AutoAllot Hostel Management System', startX, 64, { align: 'center', width: tableWidth });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text(reportName, startX, 78, { align: 'center', width: tableWidth });
      doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text(dateTimeStr, startX, 93, { align: 'center', width: tableWidth });

      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(startX, 106).lineTo(startX + tableWidth, 106).stroke();
      doc.restore();
      return 114;
    };

    // Define table columns
    let columns = [];
    if (type === 'merit') {
      columns = [
        { header: 'Rank', key: 'rank', width: 45, align: 'center' },
        { header: 'Student Name', key: 'student_name', width: 130, align: 'left' },
        { header: 'Gender', key: 'gender', width: 55, align: 'center' },
        { header: 'Category', key: 'category', width: 55, align: 'center' },
        { header: 'Branch', key: 'branch', width: 165, align: 'left' },
        { header: 'Percentage', key: 'percentage', width: 75, align: 'center' }
      ];
    } else if (type === 'allotment') {
      columns = [
        { header: 'Rank', key: 'rank', width: 40, align: 'center' },
        { header: 'Student Name', key: 'student_name', width: 125, align: 'left' },
        { header: 'Gender', key: 'gender', width: 50, align: 'center' },
        { header: 'Category', key: 'category', width: 50, align: 'center' },
        { header: 'Branch', key: 'branch', width: 145, align: 'left' },
        { header: 'Percentage', key: 'percentage', width: 60, align: 'center' },
        { header: 'Room No.', key: 'room_number', width: 55, align: 'center' }
      ];
    } else if (type === 'occupancy') {
      columns = [
        { header: 'Sr. No.', key: 'sr_no', width: 50, align: 'center' },
        { header: 'Hostel Name', key: 'hostel_name', width: 160, align: 'left' },
        { header: 'Building', key: 'building', width: 105, align: 'left' },
        { header: 'Gender Type', key: 'gender', width: 70, align: 'center' },
        { header: 'Total Rooms', key: 'total_rooms', width: 70, align: 'center' },
        { header: 'Available Beds', key: 'available_beds', width: 70, align: 'center' }
      ];
    } else {
      columns = [
        { header: 'Item Name', key: 'name', width: 250, align: 'left' },
        { header: 'Value', key: 'val', width: 275, align: 'center' }
      ];
    }

    // Function to draw Table Header (Centered headings, repeated on page overflow)
    const drawTableHeader = (currentY) => {
      doc.save();
      doc.rect(startX, currentY, tableWidth, 22).fill('#4C1D95');

      let xCursor = startX;
      columns.forEach(col => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#FFFFFF');
        doc.text(col.header, xCursor + 2, currentY + 6, {
          width: col.width - 4,
          align: 'center' // Headings are always centered
        });
        xCursor += col.width;
      });

      doc.rect(startX, currentY, tableWidth, 22).strokeColor('#334155').lineWidth(0.8).stroke();
      doc.restore();
      return currentY + 22;
    };

    let y = drawPageHeader();
    y = drawTableHeader(y);

    // Build row dataset
    let rows = [];
    if (type === 'merit') {
      rows = (data || []).map(item => {
        const student = item.students || {};
        return {
          rank: item.rank ? `#${item.rank}` : '-',
          student_name: student.student_name || 'N/A',
          gender: student.gender || 'N/A',
          category: student.category || 'N/A',
          branch: formatFullBranch(student.branch),
          percentage: `${Number(item.marks !== undefined && item.marks !== null ? item.marks : student.percentage || 0).toFixed(2)}%`
        };
      });
    } else if (type === 'allotment') {
      rows = (data || []).map(item => {
        const student = item.students || {};
        const room = item.rooms || {};
        const pct = item.marks !== undefined && item.marks !== null ? item.marks : (student.percentage || 0);
        return {
          rank: item.rank ? `#${item.rank}` : '-',
          student_name: student.student_name || 'N/A',
          gender: student.gender || 'N/A',
          category: student.category || 'N/A',
          branch: formatFullBranch(student.branch),
          percentage: `${Number(pct).toFixed(2)}%`,
          room_number: room.room_number || 'N/A'
        };
      });
    } else if (type === 'occupancy') {
      rows = (data || []).map((h, idx) => {
        return {
          sr_no: `${idx + 1}`,
          hostel_name: h.hostel_name || 'N/A',
          building: h.building || 'N/A',
          gender: h.gender || 'N/A',
          total_rooms: (h.capacity ? Math.ceil(h.capacity / 4) : 0).toString(),
          available_beds: Math.max(0, (h.capacity || 0) - (h.occupied || 0)).toString()
        };
      });
    }

    const rowHeight = 20;
    const maxPageY = 770;

    rows.forEach((row, idx) => {
      if (y + rowHeight > maxPageY) {
        doc.addPage();
        y = drawPageHeader();
        y = drawTableHeader(y);
      }

      doc.save();
      const isEven = idx % 2 === 0;
      doc.rect(startX, y, tableWidth, rowHeight).fill(isEven ? '#F8FAFC' : '#FFFFFF');

      let xCursor = startX;
      columns.forEach(col => {
        const val = row[col.key] || 'N/A';
        doc.font('Helvetica').fontSize(8).fillColor('#1E293B');
        doc.text(val, xCursor + 3, y + 5, {
          width: col.width - 6,
          align: col.align,
          height: rowHeight - 6,
          ellipsis: true
        });

        doc.rect(xCursor, y, col.width, rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
        xCursor += col.width;
      });

      doc.rect(startX, y, tableWidth, rowHeight).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
      doc.restore();

      y += rowHeight;
    });

    // Add Page Footer with Page Numbers to every page
    const pageRange = doc.bufferedPageRange();
    for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
      doc.switchToPage(i);
      doc.save();
      doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(startX, 805).lineTo(startX + tableWidth, 805).stroke();
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text(`Page ${i + 1} of ${pageRange.count}`, startX, 810, { align: 'center', width: tableWidth });
      doc.text('Government Polytechnic Nashik', startX, 810, { align: 'left', width: tableWidth });
      doc.restore();
    }

    doc.end();
  } catch (err) {
    next(err);
  }
};

export const generateExcelReport = async (req, res, next) => {
  try {
    const { type, gender } = req.query;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Report type parameter is required.' });
    }

    const formatFullBranch = await getFullBranchFormatter();

    const { data, error } = await fetchReportData(type, gender);
    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type.toUpperCase()} Report`);

    if (type === 'merit') {
      worksheet.columns = [
        { header: 'Rank', key: 'rank', width: 10 },
        { header: 'Student Name', key: 'student_name', width: 25 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Branch', key: 'branch', width: 30 },
        { header: 'Percentage (%)', key: 'marks', width: 15 }
      ];

      data.forEach(item => {
        const student = item.students || {};
        worksheet.addRow({
          rank: item.rank ? `#${item.rank}` : '-',
          student_name: student.student_name || 'N/A',
          gender: student.gender || 'N/A',
          category: student.category || 'N/A',
          branch: formatFullBranch(student.branch),
          marks: Number(item.marks !== undefined && item.marks !== null ? item.marks : student.percentage || 0).toFixed(2)
        });
      });

    } else if (type === 'allotment') {
      worksheet.columns = [
        { header: 'Rank', key: 'rank', width: 10 },
        { header: 'Student Name', key: 'student_name', width: 25 },
        { header: 'Gender', key: 'gender', width: 12 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Branch', key: 'branch', width: 30 },
        { header: 'Percentage (%)', key: 'marks', width: 15 },
        { header: 'Room Number', key: 'room_number', width: 15 }
      ];

      data.forEach(item => {
        const student = item.students || {};
        const room = item.rooms || {};
        const pct = item.marks !== undefined && item.marks !== null ? item.marks : (student.percentage || 0);
        worksheet.addRow({
          rank: item.rank ? `#${item.rank}` : '-',
          student_name: student.student_name || 'N/A',
          gender: student.gender || 'N/A',
          category: student.category || 'N/A',
          branch: formatFullBranch(student.branch),
          marks: Number(pct).toFixed(2),
          room_number: room.room_number || 'N/A'
        });
      });

    } else if (type === 'waiting') {
      worksheet.columns = [
        { header: 'Student Name', key: 'student_name', width: 25 },
        { header: 'Branch', key: 'branch', width: 25 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Percentage (%)', key: 'percentage', width: 15 },
        { header: 'Reason / Status Details', key: 'reason', width: 35 }
      ];

      data.forEach(item => {
        const student = item.students || {};
        worksheet.addRow({
          student_name: student.student_name,
          branch: formatFullBranch(student.branch),
          category: student.category,
          percentage: Number(student.percentage).toFixed(2),
          reason: item.reason
        });
      });

    } else if (type === 'branch' || type === 'category') {
      const counts = {};
      const field = type === 'branch' ? 'branch' : 'category';
      data.forEach(s => {
        const val = s[field] || 'Unknown';
        if (!counts[val]) {
          counts[val] = { total: 0, allotted: 0, waiting: 0, pending: 0 };
        }
        counts[val].total++;
        const merit = s.merit_list && s.merit_list[0];
        const status = merit ? merit.status : 'Pending';
        if (status === 'Allotted') counts[val].allotted++;
        else if (status === 'Waiting') counts[val].waiting++;
        else counts[val].pending++;
      });

      worksheet.columns = [
        { header: type === 'branch' ? 'Branch Name' : 'Category Name', key: 'name', width: 30 },
        { header: 'Total Candidates', key: 'total', width: 18 },
        { header: 'Allotted Seats', key: 'allotted', width: 15 },
        { header: 'Waiting List', key: 'waiting', width: 15 },
        { header: 'Pending / Review', key: 'pending', width: 18 }
      ];

      Object.keys(counts).forEach(key => {
        const item = counts[key];
        worksheet.addRow({
          name: type === 'branch' ? formatFullBranch(key) : key,
          total: item.total,
          allotted: item.allotted,
          waiting: item.waiting,
          pending: item.pending
        });
      });

    } else if (type === 'occupancy') {
      worksheet.columns = [
        { header: 'Hostel Name', key: 'hostel_name', width: 25 },
        { header: 'Building', key: 'building', width: 15 },
        { header: 'Gender Type', key: 'gender', width: 15 },
        { header: 'Total Capacity', key: 'capacity', width: 15 },
        { header: 'Occupied Seats', key: 'occupied', width: 15 },
        { header: 'Remaining Seats', key: 'remaining', width: 15 }
      ];

      data.forEach(h => {
        worksheet.addRow({
          hostel_name: h.hostel_name || 'N/A',
          building: h.building || 'N/A',
          gender: h.gender || 'N/A',
          capacity: h.capacity || 0,
          occupied: h.occupied || 0,
          remaining: Math.max(0, (h.capacity || 0) - (h.occupied || 0))
        });
      });
    }

    // Styling Headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7C3AED' } // purple theme
    };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=report_${type}.xlsx`
    );

    return res.send(Buffer.from(buffer));
  } catch (err) {
    next(err);
  }
};

// Generate single student allotment letter PDF
export const generateAllotmentLetter = async (req, res, next) => {
  try {
    const studentId = req.query.studentId || req.user.id;

    // Fetch student profile details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const formatBranch = await getBranchFormatter();

    // Fetch active allotment details
    const { data: allotment, error: allotmentError } = await supabase
      .from('allotments')
      .select('*, hostels(hostel_name, building), rooms(room_number)')
      .eq('student_id', studentId)
      .eq('status', 'Active')
      .maybeSingle();

    if (!allotment) {
      return res.status(400).json({ success: false, message: 'No active hostel allotment found for this student.' });
    }

    const { data: settings } = await supabase.from('settings').select('college_name, academic_year').limit(1).maybeSingle();
    const collegeName = settings?.college_name || 'AutoAllot Engineering College';
    const academicYear = settings?.academic_year || '2026-27';

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=allotment_letter_${student.student_name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Decorative border box
    doc.rect(20, 20, 572, 752).strokeColor('#4C1D95').lineWidth(2).stroke();
    doc.rect(25, 25, 562, 742).strokeColor('#C084FC').lineWidth(0.5).stroke();

    // Letter Header
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#4C1D95').text(collegeName.toUpperCase(), { align: 'center' });
    doc.font('Helvetica').fontSize(10).fillColor('#4B5563').text(`Academic Admission Session: ${academicYear}`, { align: 'center' });
    doc.moveDown(1.5);
    
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1F2937').text('HOSTEL ALLOTMENT RECEIPT & LETTER', { align: 'center', underline: true });
    doc.moveDown(2);

    // Date
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151').text(`Date: ${today}`, 50, doc.y);
    doc.moveDown();

    // Table Content Styling
    const drawRow = (label, value) => {
      const currentY = doc.y;
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#4B5563').text(label, 60, currentY);
      doc.font('Helvetica').fontSize(11).fillColor('#111827').text(`:   ${value}`, 220, currentY);
      doc.moveDown(0.8);
    };

    drawRow('Student Name', student.student_name);
    drawRow('Mobile Number', student.mobile);
    drawRow('Admission Percentage', `${student.percentage}%`);
    drawRow('Department / Branch', formatBranch(student.branch));
    drawRow('Year of Admission', student.year);
    drawRow('Admission Category', student.category);
    drawRow('Candidate Gender', student.gender);
    doc.moveDown(1);

    // Draw separation line
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(540, doc.y).stroke();
    doc.moveDown(1.5);

    // Allotted Hostel Details Section
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1E3A8A').text('ALLOTMENT DETAILS:', 60, doc.y);
    doc.moveDown(0.8);

    drawRow('Allotted Hostel Building', allotment.hostels?.hostel_name || 'N/A');
    drawRow('Building Location', allotment.hostels?.building || 'Main Campus');
    drawRow('Room Number Allocated', allotment.rooms?.room_number || 'N/A');
    drawRow('Allotted Seat / Bed', allotment.seat_number || 'N/A');
    drawRow('Allotment Status', 'ACTIVE / VERIFIED');
    doc.moveDown(1.5);

    // Signature Area
    const sigY = doc.y + 40;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Student Signature', 60, sigY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#4B5563').text('Hostel Warden / Principal', 380, sigY, { align: 'right', width: 160 });

    doc.end();
  } catch (err) {
    next(err);
  }
};
