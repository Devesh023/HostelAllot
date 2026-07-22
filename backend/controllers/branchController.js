import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

// Get all branches
export const getBranches = async (req, res, next) => {
  try {
    const { data: branches, error } = await supabase
      .from('branches')
      .select('*')
      .order('branch_name', { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, count: branches.length, data: branches });
  } catch (err) {
    next(err);
  }
};

// Get single branch by ID
export const getBranchById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: branch, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    res.status(200).json({ success: true, data: branch });
  } catch (err) {
    next(err);
  }
};

// Create a branch
export const createBranch = async (req, res, next) => {
  try {
    const { branch_name, branch_code } = req.body;

    if (!branch_name || !branch_code) {
      return res.status(400).json({ success: false, message: 'Branch name and branch code are required.' });
    }

    // Check duplicate branch_code
    const { data: existing } = await supabase
      .from('branches')
      .select('id')
      .eq('branch_code', branch_code.toUpperCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Branch code '${branch_code}' already exists.` });
    }

    const { data: branch, error } = await supabase
      .from('branches')
      .insert([{ branch_name, branch_code: branch_code.toUpperCase() }])
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Created branch: ${branch_name} (${branch_code})`);

    res.status(201).json({ success: true, message: 'Branch created successfully.', data: branch });
  } catch (err) {
    next(err);
  }
};

// Update a branch
export const updateBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { branch_name, branch_code } = req.body;

    if (!branch_name || !branch_code) {
      return res.status(400).json({ success: false, message: 'Branch name and branch code are required.' });
    }

    // Check duplicate branch_code elsewhere
    const { data: existing } = await supabase
      .from('branches')
      .select('id')
      .eq('branch_code', branch_code.toUpperCase())
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Branch code '${branch_code}' is already assigned to another branch.` });
    }

    const { data: branch, error } = await supabase
      .from('branches')
      .update({ branch_name, branch_code: branch_code.toUpperCase() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Updated branch: ${branch_name} (${branch_code})`);

    res.status(200).json({ success: true, message: 'Branch updated successfully.', data: branch });
  } catch (err) {
    next(err);
  }
};

// Delete a branch
export const deleteBranch = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch branch name for log first
    const { data: branch } = await supabase
      .from('branches')
      .select('branch_name')
      .eq('id', id)
      .single();

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found.' });
    }

    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(req.admin.username, `Deleted branch: ${branch.branch_name}`);

    res.status(200).json({ success: true, message: 'Branch deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
