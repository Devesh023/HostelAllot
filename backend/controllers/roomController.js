import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

export const getRooms = async (req, res, next) => {
  try {
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*, hostels(hostel_name, building, gender)')
      .order('room_number', { ascending: true });

    if (error) throw error;
    res.status(200).json({ success: true, count: rooms.length, data: rooms });
  } catch (err) {
    next(err);
  }
};

export const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*, hostels(hostel_name, building, gender)')
      .eq('id', id)
      .single();

    if (error || !room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const { hostel_id, room_number, floor, capacity, status, gender, room_type, is_active } = req.body;

    if (!hostel_id || !room_number || capacity === undefined || !gender) {
      return res.status(400).json({ success: false, message: 'Hostel, Room Number, Capacity, and Gender are required.' });
    }

    if (parseInt(capacity) < 0) {
      return res.status(400).json({ success: false, message: 'Capacity cannot be negative.' });
    }

    // Verify hostel exists
    const { data: hostel } = await supabase.from('hostels').select('hostel_name, gender').eq('id', hostel_id).single();
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found.' });
    }

    // Verify room_number unique in hostel
    const { data: existing } = await supabase
      .from('rooms')
      .select('id')
      .eq('hostel_id', hostel_id)
      .eq('room_number', room_number)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Room '${room_number}' already exists in this hostel.` });
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .insert([{
        hostel_id,
        room_number,
        floor: parseInt(floor) || 1,
        capacity: parseInt(capacity),
        occupied: 0,
        status: status || 'Active',
        gender,
        room_type: room_type || 'Normal',
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Created room: ${room_number} in hostel ${hostel.hostel_name}`);
    res.status(201).json({ success: true, message: 'Room created successfully.', data: room });
  } catch (err) {
    next(err);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { room_number, floor, capacity, status, gender, room_type, is_active } = req.body;

    // Fetch existing room details
    const { data: existingRoom } = await supabase
      .from('rooms')
      .select('*, hostels(hostel_name)')
      .eq('id', id)
      .single();

    if (!existingRoom) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    if (capacity !== undefined) {
      if (parseInt(capacity) < (existingRoom.occupied || 0)) {
        return res.status(400).json({ success: false, message: `Capacity cannot be less than current occupied beds (${existingRoom.occupied || 0}).` });
      }
    }

    // Verify unique room number elsewhere in same hostel
    if (room_number && room_number !== existingRoom.room_number) {
      const { data: duplicate } = await supabase
        .from('rooms')
        .select('id')
        .eq('hostel_id', existingRoom.hostel_id)
        .eq('room_number', room_number)
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        return res.status(400).json({ success: false, message: `Room '${room_number}' already exists in this hostel.` });
      }
    }

    const { data: room, error } = await supabase
      .from('rooms')
      .update({
        room_number: room_number || existingRoom.room_number,
        floor: floor !== undefined ? parseInt(floor) : existingRoom.floor,
        capacity: capacity !== undefined ? parseInt(capacity) : existingRoom.capacity,
        status: status || existingRoom.status,
        gender: gender || existingRoom.gender,
        room_type: room_type || existingRoom.room_type,
        is_active: is_active !== undefined ? is_active : existingRoom.is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Updated room: ${room.room_number} in hostel ${existingRoom.hostels?.hostel_name}`);
    res.status(200).json({ success: true, message: 'Room updated successfully.', data: room });
  } catch (err) {
    next(err);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: room } = await supabase
      .from('rooms')
      .select('*, hostels(hostel_name)')
      .eq('id', id)
      .single();

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    // Do not allow deleting room if occupied > 0
    if ((room.occupied || 0) > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete room as students are currently allotted to it.' });
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(req.admin.username, `Deleted room ${room.room_number} from hostel ${room.hostels?.hostel_name}`);
    res.status(200).json({ success: true, message: 'Room deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
