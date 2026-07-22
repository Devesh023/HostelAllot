import { supabase } from '../config/supabase.js';

// Get administrative dashboard aggregations, charts, and logs
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Fetch exact total counts from tables
    const { count: totalStudents, error: studentCountErr } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    if (studentCountErr) throw studentCountErr;

    const { count: totalBranches, error: branchCountErr } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });
    if (branchCountErr) throw branchCountErr;

    const { count: totalHostels, error: hostelCountErr } = await supabase
      .from('hostels')
      .select('*', { count: 'exact', head: true });
    if (hostelCountErr) throw hostelCountErr;

    // 2. Calculate seat capacities & occupied counts from rooms, fallback to hostels if no rooms
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('capacity, occupied');
    
    let totalSeats = 0;
    let filledSeats = 0;
    let totalRooms = 0;

    if (!roomsError && roomsData && roomsData.length > 0) {
      totalRooms = roomsData.length;
      roomsData.forEach((r) => {
        totalSeats += r.capacity || 0;
        filledSeats += r.occupied || 0;
      });
    } else {
      const { data: hostelsData } = await supabase
        .from('hostels')
        .select('capacity, occupied');
      if (hostelsData) {
        hostelsData.forEach((h) => {
          totalSeats += h.capacity || 0;
          filledSeats += h.occupied || 0;
        });
      }
    }
    const remainingSeats = totalSeats - filledSeats;

    // 3. Get total waiting students (status = 'Waiting')
    const { count: waitingStudents, error: waitingCountErr } = await supabase
      .from('merit_list')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Waiting');
    if (waitingCountErr) throw waitingCountErr;

    // Fetch branches to build a mapping from name/code to Full Name (Code)
    const { data: dbBranches } = await supabase.from('branches').select('*');
    const branchMap = {};
    if (dbBranches) {
      dbBranches.forEach(b => {
        branchMap[b.branch_name.toUpperCase()] = `${b.branch_name} (${b.branch_code})`;
        branchMap[b.branch_code.toUpperCase()] = `${b.branch_name} (${b.branch_code})`;
      });
    }
    const formatBranch = (name) => {
      if (!name) return 'Unknown';
      return branchMap[name.toUpperCase()] || name;
    };

    // 4. Branch Distribution Chart Data (based on students enrolled)
    const { data: studentBranches, error: studBranchErr } = await supabase
      .from('students')
      .select('branch');
    if (studBranchErr) throw studBranchErr;

    const branchWiseCounts = {};
    studentBranches.forEach((s) => {
      if (s.branch) {
        const formatted = formatBranch(s.branch);
        branchWiseCounts[formatted] = (branchWiseCounts[formatted] || 0) + 1;
      }
    });

    // 5. Category Distribution Chart Data (based on students enrolled)
    const { data: studentCategories, error: studCategoryErr } = await supabase
      .from('students')
      .select('category');
    if (studCategoryErr) throw studCategoryErr;

    const categoryWiseCounts = {};
    studentCategories.forEach((s) => {
      if (s.category) {
        categoryWiseCounts[s.category] = (categoryWiseCounts[s.category] || 0) + 1;
      }
    });

    // 6. Fetch 10 most recent activity logs
    const { data: activities, error: activityError } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (activityError) throw activityError;

    res.status(200).json({
      success: true,
      stats: {
        totalStudents: totalStudents || 0,
        totalBranches: totalBranches || 0,
        totalHostels: totalHostels || 0,
        totalRooms,
        totalSeats,
        filledSeats,
        remainingSeats,
        waitingStudents: waitingStudents || 0,
        branchWise: branchWiseCounts,
        categoryWise: categoryWiseCounts,
        latestActivities: activities || []
      }
    });
  } catch (err) {
    next(err);
  }
};
