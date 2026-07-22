import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit3, FiTrash2, FiX } from 'react-icons/fi';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state control
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null); // null for Add, category obj for Edit

  // Form Hooks
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmitForm = async (data) => {
    try {
      let res;
      data.reservation_percentage = parseFloat(data.reservation_percentage);

      if (currentCategory) {
        res = await axios.put(`/api/categories/${currentCategory.id}`, data);
      } else {
        res = await axios.post('/api/categories', data);
      }

      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddEditModal(false);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    }
  };

  const handleOpenAdd = () => {
    setCurrentCategory(null);
    reset({
      category_name: '',
      reservation_percentage: ''
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (category) => {
    setCurrentCategory(category);
    reset(category);
    setShowAddEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated students, allotments, and seat configs will be lost.')) return;
    try {
      const res = await axios.delete(`/api/categories/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchCategories();
      }
    } catch (err) {
      toast.error('Failed to delete category.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Admission Categories</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure admission categories, verify state reservation percentages, and review classifications.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
        >
          <FiPlus /> Add Reservation Category
        </button>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600"></div>
            <span className="text-sm text-slate-400">Loading category list...</span>
          </div>
        ) : categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Category Name</th>
                  <th className="p-4">Reservation Allocation (%)</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-800 dark:text-white">{category.category_name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-700 dark:text-slate-350">{category.reservation_percentage}%</span>
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full">
                          <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${category.reservation_percentage}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6 space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(category)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-violet-500/10 dark:bg-slate-800 text-slate-500 hover:text-violet-500 transition-colors"
                        title="Edit"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(category.id)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-red-500/10 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-slate-400">No reservation categories saved. Add one above.</div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {currentCategory ? 'Edit Reservation Category' : 'Register Reservation Category'}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">CATEGORY NAME</label>
                <input
                  placeholder="e.g. OBC, SC, ST, EWS, OPEN"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 uppercase"
                  {...register('category_name', { required: 'Category name is required' })}
                />
                {errors.category_name && <span className="text-[10px] text-red-400">{errors.category_name.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">RESERVATION ALLOCATION %</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 15.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('reservation_percentage', { required: 'Percentage is required', min: 0, max: 100 })}
                />
                {errors.reservation_percentage && <span className="text-[10px] text-red-400">{errors.reservation_percentage.message}</span>}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-350 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-550 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-violet-600/10"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
