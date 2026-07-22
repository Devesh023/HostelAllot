import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

// Get all hostels
export const getHostels = async (req, res, next) => {
  try {
    const { data: hostels, error } = await supabase
      .from('hostels')
      .select('*, rooms(*)')
      .order('hostel_name', { ascending: true });

    if (error) throw error;

    // Map remaining seats calculation
    const formattedHostels = hostels.map(h => {
      const rooms = h.rooms || [];
      const totalRooms = rooms.length;
      const totalBeds = totalRooms > 0 ? rooms.reduce((sum, r) => sum + (r.capacity || 0), 0) : (h.capacity || 0);
      const occupiedBeds = totalRooms > 0 ? rooms.reduce((sum, r) => sum + (r.occupied || 0), 0) : (h.occupied || 0);
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);
      return {
        ...h,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        capacity: totalBeds,
        occupied: occupiedBeds,
        remaining: availableBeds
      };
    });

    res.status(200).json({ success: true, count: formattedHostels.length, data: formattedHostels });
  } catch (err) {
    next(err);
  }
};

// Get single hostel by ID
export const getHostelById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: hostel, error } = await supabase
      .from('hostels')
      .select('*, rooms(*)')
      .eq('id', id)
      .single();

    if (error || !hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found.' });
    }

    const rooms = hostel.rooms || [];
    const totalRooms = rooms.length;
    const totalBeds = totalRooms > 0 ? rooms.reduce((sum, r) => sum + (r.capacity || 0), 0) : (hostel.capacity || 0);
    const occupiedBeds = totalRooms > 0 ? rooms.reduce((sum, r) => sum + (r.occupied || 0), 0) : (hostel.occupied || 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);

    res.status(200).json({
      success: true,
      data: {
        ...hostel,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        capacity: totalBeds,
        occupied: occupiedBeds,
        remaining: availableBeds
      }
    });
  } catch (err) {
    next(err);
  }
};

// Create a hostel
export const createHostel = async (req, res, next) => {
  try {
    const { hostel_name, gender, building, floors, capacity, status } = req.body;

    if (!hostel_name || !gender || !building || capacity === undefined) {
      return res.status(400).json({ success: false, message: 'Hostel name, gender, building, and capacity are required.' });
    }

    // Check duplicate hostel_name
    const { data: existing } = await supabase
      .from('hostels')
      .select('id')
      .eq('hostel_name', hostel_name)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Hostel '${hostel_name}' already exists.` });
    }

    const { data: hostel, error } = await supabase
      .from('hostels')
      .insert([{
        hostel_name,
        gender,
        building,
        floors: floors || 1,
        capacity,
        occupied: 0,
        status: status || 'Active'
      }])
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Created hostel: ${hostel_name} (Capacity: ${capacity})`);

    res.status(201).json({ success: true, message: 'Hostel created successfully.', data: hostel });
  } catch (err) {
    next(err);
  }
};

// Update a hostel
export const updateHostel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hostel_name, gender, building, floors, capacity, status } = req.body;

    if (!hostel_name || !gender || !building || capacity === undefined) {
      return res.status(400).json({ success: false, message: 'Hostel name, gender, building, and capacity are required.' });
    }

    // Check duplicate hostel name elsewhere
    const { data: existing } = await supabase
      .from('hostels')
      .select('id')
      .eq('hostel_name', hostel_name)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Hostel name '${hostel_name}' is already assigned to another hostel.` });
    }

    const { data: hostel, error } = await supabase
      .from('hostels')
      .update({
        hostel_name,
        gender,
        building,
        floors: floors || 1,
        capacity,
        status: status || 'Active'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Updated hostel: ${hostel_name} (Capacity: ${capacity})`);

    res.status(200).json({ success: true, message: 'Hostel updated successfully.', data: hostel });
  } catch (err) {
    next(err);
  }
};

// Delete a hostel
export const deleteHostel = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch hostel name for log first
    const { data: hostel } = await supabase
      .from('hostels')
      .select('hostel_name')
      .eq('id', id)
      .single();

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found.' });
    }

    const { error } = await supabase
      .from('hostels')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(req.admin.username, `Deleted hostel: ${hostel.hostel_name}`);

    res.status(200).json({ success: true, message: 'Hostel deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
