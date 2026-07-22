import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

// Get Merit List
export const getMeritList = async (req, res, next) => {
  try {
    const { data: merit, error } = await supabase
      .from('merit_list')
      .select('*, students(id, student_name, branch, category, percentage, year, gender, disability, income, mobile, nashik_municipal_corporation)')
      .order('rank', { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, count: merit.length, data: merit });
  } catch (err) {
    next(err);
  }
};

// Get Active Allotments
export const getAllotments = async (req, res, next) => {
  try {
    const { data: allotments, error } = await supabase
      .from('allotments')
      .select('*, students(id, student_name, branch, category, percentage, year, gender, disability, income, mobile, nashik_municipal_corporation), hostels(*)')
      .eq('status', 'Active');

    if (error) throw error;

    res.status(200).json({ success: true, count: allotments.length, data: allotments });
  } catch (err) {
    next(err);
  }
};

// Allotment Algorithm
export const generateMerit = async (req, res, next) => {
  try {
    // 1. Fetch all data needed
    const { data: hostels, error: hErr } = await supabase.from('hostels').select('*').eq('status', 'Active');
    const { data: students, error: sErr } = await supabase
      .from('students')
      .select('id, student_name, branch, category, percentage, year, gender, disability, income, mobile, nashik_municipal_corporation');

    const { data: dbRooms, error: rErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('status', 'Active')
      .eq('is_active', true)
      .order('room_number', { ascending: true });

    if (hErr || sErr || rErr) {
      throw new Error(`Data fetch failed. Hostels: ${hErr?.message}, Students: ${sErr?.message}, Rooms: ${rErr?.message}`);
    }

    // 2. Filter & Sort students
    // Ignore students whose nashik_municipal_corporation = YES (case-insensitive)
    const eligibleStudents = (students || []).filter(s => {
      if (s.nashik_municipal_corporation === null || s.nashik_municipal_corporation === undefined) {
        return true;
      }
      if (typeof s.nashik_municipal_corporation === 'boolean') {
        return s.nashik_municipal_corporation === false;
      }
      if (typeof s.nashik_municipal_corporation === 'string') {
        const val = s.nashik_municipal_corporation.trim().toUpperCase();
        return val !== 'YES' && val !== 'TRUE';
      }
      return true;
    });

    // Sort by Percentage DESC, student_name ASC
    eligibleStudents.sort((a, b) => {
      const pctA = parseFloat(a.percentage) || 0;
      const pctB = parseFloat(b.percentage) || 0;
      if (pctB !== pctA) {
        return pctB - pctA;
      }
      return a.student_name.localeCompare(b.student_name);
    });

    const newAllotments = [];
    const newMeritList = [];
    const newWaitingList = [];

    // Map hostels for easy tracking of running occupied seats
    const hostelMap = {};
    hostels.forEach(h => {
      h.running_occupied = 0;
      hostelMap[h.id] = h;
    });

    // Initialise room list with running occupied resets
    const roomList = (dbRooms || []).map(r => ({
      ...r,
      running_occupied: 0
    }));

    // 3. Process allocation student by student (rank-wise)
    eligibleStudents.forEach((student, index) => {
      const rank = index + 1;
      let allottedHostel = null;
      let allottedRoom = null;

      // Find active hostels matching student gender
      const matchingHostels = hostels.filter(h => 
        h.status === 'Active' && 
        h.gender === student.gender
      );

      // Try to find a room in matching hostels
      for (const hostel of matchingHostels) {
        // Find rooms in this hostel matching student gender
        const hostelRooms = roomList.filter(r => 
          r.hostel_id === hostel.id && 
          r.gender === student.gender
        );

        const isDisabled = student.disability === true || student.disability === 'Yes';

        if (isDisabled) {
          // 1. Try Accessible rooms
          allottedRoom = hostelRooms.find(r => 
            r.room_type === 'Accessible' && 
            r.running_occupied < r.capacity
          );
          // 2. Fall back to Normal rooms
          if (!allottedRoom) {
            allottedRoom = hostelRooms.find(r => 
              r.room_type === 'Normal' && 
              r.running_occupied < r.capacity
            );
          }
        } else {
          // Only Normal rooms for non-disabled students
          allottedRoom = hostelRooms.find(r => 
            r.room_type === 'Normal' && 
            r.running_occupied < r.capacity
          );
        }

        if (allottedRoom) {
          allottedHostel = hostel;
          break;
        }
      }

      if (allottedHostel && allottedRoom) {
        // Successful allotment!
        allottedRoom.running_occupied++;
        allottedHostel.running_occupied++;

        const seatNo = `${allottedRoom.room_number}-Bed${allottedRoom.running_occupied}`;

        newAllotments.push({
          student_id: student.id,
          hostel_id: allottedHostel.id,
          room_id: allottedRoom.id,
          seat_number: seatNo,
          status: 'Active'
        });

        newMeritList.push({
          student_id: student.id,
          rank: rank,
          marks: Number(student.percentage),
          status: 'Allotted'
        });
      } else {
        // Waitlist if capacity is exhausted
        newMeritList.push({
          student_id: student.id,
          rank: rank,
          marks: Number(student.percentage),
          status: 'Waiting'
        });

        newWaitingList.push({
          student_id: student.id,
          reason: 'Hostel capacity exhausted.'
        });
      }
    });

    // 4. Update the database
    // A. Archive all current active allotments
    const { error: archErr } = await supabase
      .from('allotments')
      .update({ status: 'Archived' })
      .eq('status', 'Active');
    if (archErr) throw archErr;

    // B. Clear merit list
    const { error: delMeritErr } = await supabase.from('merit_list').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delMeritErr) throw delMeritErr;

    // C. Clear waiting list
    const { error: delWaitErr } = await supabase.from('waiting_list').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delWaitErr) throw delWaitErr;

    // D. Insert new merit records
    if (newMeritList.length > 0) {
      const { error: insMeritErr } = await supabase.from('merit_list').insert(newMeritList);
      if (insMeritErr) throw insMeritErr;
    }

    // E. Insert new allotments
    if (newAllotments.length > 0) {
      const { error: insAllotErr } = await supabase.from('allotments').insert(newAllotments);
      if (insAllotErr) throw insAllotErr;
    }

    // F. Insert new waiting lists
    if (newWaitingList.length > 0) {
      const { error: insWaitErr } = await supabase.from('waiting_list').insert(newWaitingList);
      if (insWaitErr) throw insWaitErr;
    }

    // G. Update hostel occupied count in DB
    for (const hId of Object.keys(hostelMap)) {
      const h = hostelMap[hId];
      await supabase.from('hostels').update({ occupied: h.running_occupied }).eq('id', h.id);
    }

    // H. Update rooms occupied count in DB
    for (const r of roomList) {
      await supabase.from('rooms').update({ occupied: r.running_occupied }).eq('id', r.id);
    }

    // I. Log the event
    await logActivity(req.admin ? req.admin.username : 'System', `Executed Merit Allotment Run: ${newAllotments.length} allotted, ${newWaitingList.length} waitlisted.`);

    res.status(200).json({
      success: true,
      message: 'Merit list and hostel allotments generated successfully.',
      allottedCount: newAllotments.length,
      waitingCount: newWaitingList.length
    });
  } catch (err) {
    next(err);
  }
};
