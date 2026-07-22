import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

// Get all seat configurations with relations
export const getSeatConfigurations = async (req, res, next) => {
  try {
    const { data: configs, error } = await supabase
      .from('seat_configuration')
      .select(`
        id,
        seat_count,
        branch_id,
        category_id,
        hostel_id,
        branches (branch_name, branch_code),
        categories (category_name, reservation_percentage),
        hostels (hostel_name, gender)
      `);

    if (error) throw error;

    res.status(200).json({ success: true, count: configs.length, data: configs });
  } catch (err) {
    next(err);
  }
};

// Create or update a seat configuration (Upsert based on unique constraint)
export const createOrUpdateSeatConfig = async (req, res, next) => {
  try {
    const { branch_id, category_id, hostel_id, seat_count } = req.body;

    if (!branch_id || !category_id || !hostel_id || seat_count === undefined) {
      return res.status(400).json({ success: false, message: 'Branch, Category, Hostel, and Seat Count are required.' });
    }

    if (seat_count < 0) {
      return res.status(400).json({ success: false, message: 'Seat count cannot be negative.' });
    }

    // Verify hostel gender mismatch (optional but helpful)
    const { data: hostel } = await supabase.from('hostels').select('hostel_name, gender').eq('id', hostel_id).single();
    const { data: branch } = await supabase.from('branches').select('branch_name').eq('id', branch_id).single();
    const { data: category } = await supabase.from('categories').select('category_name').eq('id', category_id).single();

    if (!hostel || !branch || !category) {
      return res.status(404).json({ success: false, message: 'Invalid Branch, Category, or Hostel reference.' });
    }

    // Check if configuration already exists to update, otherwise insert
    const { data: existing } = await supabase
      .from('seat_configuration')
      .select('id')
      .eq('branch_id', branch_id)
      .eq('category_id', category_id)
      .eq('hostel_id', hostel_id)
      .maybeSingle();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('seat_configuration')
        .update({ seat_count })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('seat_configuration')
        .insert([{ branch_id, category_id, hostel_id, seat_count }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    await logActivity(
      req.admin.username,
      `Configured seats for ${branch.branch_name} (${category.category_name}) in ${hostel.hostel_name}: ${seat_count} seats`
    );

    res.status(200).json({ success: true, message: 'Seat configuration saved successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

// Delete a seat configuration
export const deleteSeatConfig = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('seat_configuration')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(req.admin.username, `Removed seat configuration (ID: ${id})`);

    res.status(200).json({ success: true, message: 'Seat configuration deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
