import { supabase } from '../config/supabase.js';
import { logActivity } from '../middleware/logger.js';

// Get all categories
export const getCategories = async (req, res, next) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('reservation_percentage', { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    next(err);
  }
};

// Get single category by ID
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// Create a category
export const createCategory = async (req, res, next) => {
  try {
    const { category_name, reservation_percentage } = req.body;

    if (!category_name || reservation_percentage === undefined) {
      return res.status(400).json({ success: false, message: 'Category name and reservation percentage are required.' });
    }

    // Check duplicate category_name
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('category_name', category_name.toUpperCase())
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Category '${category_name}' already exists.` });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert([{ category_name: category_name.toUpperCase(), reservation_percentage }])
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Created category: ${category_name} (${reservation_percentage}%)`);

    res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
  } catch (err) {
    next(err);
  }
};

// Update a category
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_name, reservation_percentage } = req.body;

    if (!category_name || reservation_percentage === undefined) {
      return res.status(400).json({ success: false, message: 'Category name and reservation percentage are required.' });
    }

    // Check duplicate category name elsewhere
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('category_name', category_name.toUpperCase())
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: `Category name '${category_name}' is already assigned to another category.` });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .update({ category_name: category_name.toUpperCase(), reservation_percentage })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(req.admin.username, `Updated category: ${category_name} (${reservation_percentage}%)`);

    res.status(200).json({ success: true, message: 'Category updated successfully.', data: category });
  } catch (err) {
    next(err);
  }
};

// Delete a category
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch category name for log first
    const { data: category } = await supabase
      .from('categories')
      .select('category_name')
      .eq('id', id)
      .single();

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(req.admin.username, `Deleted category: ${category.category_name}`);

    res.status(200).json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
