import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

// Get Current App Settings
export const getSettings = async (req, res, next) => {
  try {
    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

// Update App Settings
export const updateSettings = async (req, res, next) => {
  try {
    const { college_name, academic_year, reservation_rules } = req.body;

    if (!college_name || !academic_year) {
      return res.status(400).json({ success: false, message: 'College name and academic year are required.' });
    }

    const { data: current } = await supabase.from('settings').select('id').limit(1).maybeSingle();

    let result;
    if (current) {
      const { data, error } = await supabase
        .from('settings')
        .update({ college_name, academic_year, reservation_rules })
        .eq('id', current.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert([{ college_name, academic_year, reservation_rules }])
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    await logActivity(req.admin.username, `Updated system settings: Academic Year ${academic_year}`);

    res.status(200).json({ success: true, message: 'Settings updated successfully.', data: result });
  } catch (err) {
    next(err);
  }
};

// Export entire database to JSON backup file
export const exportBackup = async (req, res, next) => {
  try {
    const tables = [
      'settings',
      'branches',
      'categories',
      'hostels',
      'students',
      'seat_configuration',
      'merit_list',
      'allotments',
      'waiting_list',
      'activity_logs'
    ];

    const backupData = {};

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      backupData[table] = data || [];
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=autoallot_backup.json');
    res.status(200).json(backupData);
  } catch (err) {
    next(err);
  }
};

// Import / Restore database from JSON backup file
export const restoreBackup = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a backup JSON file.' });
    }

    const backupData = JSON.parse(req.file.buffer.toString());

    // We truncate and restore in proper foreign key order:
    // Deleting in reverse dependency order:
    const deleteOrder = [
      'waiting_list',
      'allotments',
      'merit_list',
      'seat_configuration',
      'students',
      'hostels',
      'categories',
      'branches',
      'settings',
      'activity_logs'
    ];

    for (const table of deleteOrder) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error(`Failed to clear table ${table} during restore:`, error.message);
      }
    }

    // Restoring in dependency order:
    const insertOrder = [
      'settings',
      'branches',
      'categories',
      'hostels',
      'students',
      'seat_configuration',
      'merit_list',
      'allotments',
      'waiting_list',
      'activity_logs'
    ];

    for (const table of insertOrder) {
      const rows = backupData[table];
      if (rows && rows.length > 0) {
        const { error } = await supabase.from(table).insert(rows);
        if (error) {
          throw new Error(`Failed to restore table ${table}: ${error.message}`);
        }
      }
    }

    await logActivity(req.admin.username, 'Restored database from a JSON backup file.');

    res.status(200).json({ success: true, message: 'Database successfully restored from backup.' });
  } catch (err) {
    next(err);
  }
};
