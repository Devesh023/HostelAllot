import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';
import ExcelJS from 'exceljs';

// Helper to map DB columns to Client-facing formats
const mapStudentToClient = (s) => {
  if (!s) return null;
  return {
    id: s.id,
    student_name: s.student_name,
    category: s.category,
    branch: s.branch,
    percentage: Number(s.percentage),
    year: s.year,
    gender: s.gender,
    disability: s.disability ? 'Yes' : 'No',
    income: Number(s.income),
    mobile: s.mobile,
    nashik_municipal_corporation: s.nashik_municipal_corporation ? 'Yes' : 'No',
    created_at: s.created_at,
    updated_at: s.updated_at
  };
};

// Helper to map Client-facing inputs to DB column formats
const mapClientToDb = (data) => {
  return {
    student_name: data.student_name,
    category: data.category,
    branch: data.branch,
    percentage: parseFloat(data.percentage),
    year: data.year,
    gender: data.gender,
    disability: data.disability === 'Yes' || data.disability === true,
    income: parseFloat(data.income),
    mobile: data.mobile,
    nashik_municipal_corporation: data.nashik_municipal_corporation === 'Yes' || data.nashik_municipal_corporation === true
  };
};

// Get Students list with pagination, search, and filtering
export const getStudents = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      branch = '', 
      category = '', 
      gender = '', 
      year = '', 
      disability = '',
      nashik_municipal_corporation = ''
    } = req.query;

    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    // Apply Search on student_name
    if (search) {
      query = query.ilike('student_name', `%${search}%`);
    }

    // Apply Filters
    if (branch) query = query.eq('branch', branch);
    if (category) query = query.eq('category', category);
    if (gender) query = query.eq('gender', gender);
    if (year) query = query.eq('year', year);
    
    if (disability) {
      query = query.eq('disability', disability === 'Yes');
    }
    if (nashik_municipal_corporation) {
      query = query.eq('nashik_municipal_corporation', nashik_municipal_corporation === 'Yes');
    }

    // Order by created_at
    query = query.order('created_at', { ascending: false });

    // Range for pagination
    const { data: students, count, error } = await query.range(from, to);

    if (error) throw error;

    const mappedStudents = (students || []).map(mapStudentToClient);

    res.status(200).json({
      success: true,
      count,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
      data: mappedStudents
    });
  } catch (err) {
    next(err);
  }
};

// Get single student details
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.status(200).json({ success: true, data: mapStudentToClient(student) });
  } catch (err) {
    next(err);
  }
};

// Create Student Record
export const createStudent = async (req, res, next) => {
  try {
    const clientData = req.body;

    if (!clientData.student_name || !clientData.category || !clientData.branch || clientData.percentage === undefined || !clientData.year || !clientData.gender || !clientData.disability || clientData.income === undefined || !clientData.mobile || !clientData.nashik_municipal_corporation) {
      return res.status(400).json({ success: false, message: 'All student details are required.' });
    }

    const dbRecord = mapClientToDb(clientData);

    const { data: student, error } = await supabase
      .from('students')
      .insert([dbRecord])
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.user.name, `Added student record: ${clientData.student_name} (${clientData.branch})`);

    res.status(201).json({ success: true, message: 'Student record added successfully.', data: mapStudentToClient(student) });
  } catch (err) {
    next(err);
  }
};

// Update Student Record
export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clientData = req.body;

    if (!clientData.student_name || !clientData.category || !clientData.branch || clientData.percentage === undefined || !clientData.year || !clientData.gender || !clientData.disability || clientData.income === undefined || !clientData.mobile || !clientData.nashik_municipal_corporation) {
      return res.status(400).json({ success: false, message: 'All student details are required.' });
    }

    const dbRecord = mapClientToDb(clientData);

    const { data: student, error } = await supabase
      .from('students')
      .update(dbRecord)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.user.name, `Updated student record: ${clientData.student_name} (${clientData.branch})`);

    res.status(200).json({ success: true, message: 'Student record updated successfully.', data: mapStudentToClient(student) });
  } catch (err) {
    next(err);
  }
};

// Delete Student Record
export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch details for logging
    const { data: student } = await supabase
      .from('students')
      .select('student_name, branch')
      .eq('id', id)
      .single();

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(req.user.name, `Deleted student: ${student.student_name} (${student.branch})`);

    res.status(200).json({ success: true, message: 'Student record deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// Bulk Delete Students
export const bulkDeleteStudents = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide array of student IDs to delete.' });
    }

    const { error } = await supabase
      .from('students')
      .delete()
      .in('id', ids);

    if (error) throw error;

    await logActivity(req.user.name, `Bulk deleted ${ids.length} student records.`);

    res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} records.` });
  } catch (err) {
    next(err);
  }
};

// Excel Export
export const exportStudentsExcel = async (req, res, next) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('student_name', { ascending: true });

    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define Columns
    worksheet.columns = [
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Branch Code', key: 'branch', width: 15 },
      { header: 'Percentage (%)', key: 'percentage', width: 15 },
      { header: 'Year', key: 'year', width: 15 },
      { header: 'Gender (Male/Female)', key: 'gender', width: 15 },
      { header: 'Disability (Yes/No)', key: 'disability', width: 15 },
      { header: 'Annual Income', key: 'income', width: 15 },
      { header: 'Mobile Number', key: 'mobile', width: 15 },
      { header: 'Nashik Municipal Resident (Yes/No)', key: 'nashik_municipal_corporation', width: 30 }
    ];

    // Add rows
    students.forEach(s => {
      worksheet.addRow({
        student_name: s.student_name,
        category: s.category,
        branch: s.branch,
        percentage: Number(s.percentage),
        year: s.year,
        gender: s.gender,
        disability: s.disability ? 'Yes' : 'No',
        income: Number(s.income),
        mobile: s.mobile,
        nashik_municipal_corporation: s.nashik_municipal_corporation ? 'Yes' : 'No'
      });
    });

    // Styling Headers
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '6D28D9' }
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=students_list.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// Excel Import
export const importStudentsExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel file.' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const insertedRows = [];
    const errors = [];

    worksheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;

      try {
        const student_name = row.getCell(1).text.trim();
        const category = row.getCell(2).text.trim().toUpperCase();
        const branch = row.getCell(3).text.trim().toUpperCase();
        const percentage = parseFloat(row.getCell(4).value) || 0;
        const year = row.getCell(5).text.trim();
        const gender = row.getCell(6).text.trim();
        const disabilityStr = row.getCell(7).text.trim() || 'No';
        const income = parseFloat(row.getCell(8).value) || 0;
        const mobile = row.getCell(9).text.trim();
        const nashik_municipal_corporation_str = row.getCell(10).text.trim() || 'No';

        if (!student_name || !category || !branch || percentage === undefined || !year || !gender || !disabilityStr || income === undefined || !mobile || !nashik_municipal_corporation_str) {
          throw new Error('Mandatory field is missing.');
        }

        const dbRecord = mapClientToDb({
          student_name,
          category,
          branch,
          percentage,
          year,
          gender,
          disability: disabilityStr,
          income,
          mobile,
          nashik_municipal_corporation: nashik_municipal_corporation_str
        });

        insertedRows.push(dbRecord);
      } catch (err) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      }
    });

    if (insertedRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records found in the Excel file.',
        errors
      });
    }

    let successCount = 0;
    const dbErrors = [];

    for (const record of insertedRows) {
      const { error } = await supabase.from('students').insert([record]);
      if (error) {
        dbErrors.push(`Failed to insert ${record.student_name}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    await logActivity(req.user.name, `Imported ${successCount} student records via Excel.`);

    res.status(200).json({
      success: true,
      message: `Successfully imported ${successCount} out of ${insertedRows.length} records.`,
      failedCount: insertedRows.length - successCount,
      errors: [...errors, ...dbErrors]
    });
  } catch (err) {
    next(err);
  }
};
