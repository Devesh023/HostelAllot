import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  FiSearch, FiFilter, FiPlus, FiTrash2, FiDownload, FiUpload, 
  FiEye, FiEdit3, FiX, FiAlertCircle 
} from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';

export default function Students() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // State Management
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filters state
  const [search, setSearch] = useState(initialSearch);
  const [branchFilter, setBranchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [disabilityFilter, setDisabilityFilter] = useState('');
  const [nashikFilter, setNashikFilter] = useState('');

  // Dropdown list options
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);

  // Modal control states
  const formatBranch = (branchVal) => {
    if (!branchVal) return '';
    const branchObj = branches.find(b => b.branch_name === branchVal || b.branch_code === branchVal);
    if (!branchObj) return branchVal;
    return `${branchObj.branch_name} (${branchObj.branch_code})`;
  };
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null); // null for Add, student obj for Edit
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Form Hooks
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Load configuration dropdowns on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          axios.get('/api/branches'),
          axios.get('/api/categories')
        ]);
        if (bRes.data.success) setBranches(bRes.data.data);
        if (cRes.data.success) setCategories(cRes.data.data);
      } catch (err) {
        console.error('Failed to load filter configurations', err);
      }
    };
    fetchConfigs();
  }, []);

  // Fetch Student Records
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/students', {
        params: {
          page,
          limit,
          search,
          branch: branchFilter,
          category: categoryFilter,
          gender: genderFilter,
          year: yearFilter,
          disability: disabilityFilter,
          nashik_municipal_corporation: nashikFilter
        }
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setTotalCount(res.data.count);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      toast.error('Failed to load student records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, branchFilter, categoryFilter, genderFilter, yearFilter, disabilityFilter, nashikFilter]);

  // Handle Form Submission (Add / Edit)
  const onSubmitForm = async (data) => {
    try {
      let res;
      // Parse numbers
      data.percentage = parseFloat(data.percentage);
      data.income = parseFloat(data.income) || 0;

      if (currentStudent) {
        // Edit student
        res = await axios.put(`/api/students/${currentStudent.id}`, data);
      } else {
        // Add student
        res = await axios.post('/api/students', data);
      }

      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddEditModal(false);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student record.');
    }
  };

  // Open Add Student modal
  const handleOpenAdd = () => {
    setCurrentStudent(null);
    reset({
      student_name: '',
      category: 'OPEN',
      branch: '',
      percentage: '',
      year: 'First Year',
      gender: 'Male',
      disability: 'No',
      income: '',
      mobile: '',
      nashik_municipal_corporation: 'No'
    });
    setShowAddEditModal(true);
  };

  // Open Edit Student modal
  const handleOpenEdit = (student) => {
    setCurrentStudent(student);
    reset({
      student_name: student.student_name,
      category: student.category,
      branch: student.branch,
      percentage: student.percentage,
      year: student.year,
      gender: student.gender,
      disability: student.disability,
      income: student.income,
      mobile: student.mobile,
      nashik_municipal_corporation: student.nashik_municipal_corporation
    });
    setShowAddEditModal(true);
  };

  // Open Profile details modal
  const handleOpenProfile = async (student) => {
    try {
      const res = await axios.get(`/api/students/${student.id}`);
      if (res.data.success) {
        setProfileStudent(res.data.data);
        setShowProfileModal(true);
      }
    } catch (err) {
      toast.error('Failed to retrieve student profile.');
    }
  };

  // Delete Student
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student record?')) return;
    try {
      const res = await axios.delete(`/api/students/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchStudents();
      }
    } catch (err) {
      toast.error('Failed to delete student record.');
    }
  };

  // Bulk Delete Selected Students
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected student records?`)) return;

    try {
      const res = await axios.delete('/api/students/bulk-delete', {
        data: { ids: selectedIds }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedIds([]);
        fetchStudents();
      }
    } catch (err) {
      toast.error('Bulk deletion failed.');
    }
  };

  // Checkbox selectors helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Excel template Export downloader
  const handleExportExcel = () => {
    window.open('/api/students/export/excel', '_blank');
  };

  // Excel Import Submit
  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select an Excel file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    setImporting(true);
    try {
      const res = await axios.post('/api/students/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setShowImportModal(false);
        setImportFile(null);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import Excel file.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header controls section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight dark:text-white">Student Management</h2>
          <p className="text-xs text-slate-400 mt-1">Configure and manage candidate lists entered from offline forms.</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-transparent dark:border-slate-800 transition-colors"
          >
            <FiDownload className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-transparent dark:border-slate-800 transition-colors"
          >
            <FiUpload className="w-4 h-4" /> Import Excel
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-650/15 transition-all"
          >
            <FiPlus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Search & Filters card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Branch Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer focus:border-violet-500"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.branch_name}>{b.branch_name} ({b.branch_code})</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer focus:border-violet-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.category_name}>{c.category_name}</option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer focus:border-violet-500"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer focus:border-violet-500"
            >
              <option value="">All Years</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
            </select>

            {/* Disability Filter */}
            <select
              value={disabilityFilter}
              onChange={(e) => setDisabilityFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer focus:border-violet-500"
            >
              <option value="">Disability (All)</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>

            {/* Nashik Filter */}
            <select
              value={nashikFilter}
              onChange={(e) => setNashikFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer focus:border-violet-500"
            >
              <option value="">Nashik Municipal (All)</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl flex items-center justify-between animate-fade-in">
            <span className="text-xs font-semibold text-red-500">{selectedIds.length} records selected</span>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors shadow-md"
            >
              <FiTrash2 /> Bulk Delete
            </button>
          </div>
        )}
      </div>

      {/* Students Data Grid Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-650"></div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Syncing records...</span>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedIds.length === students.length && students.length > 0}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Branch</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4">Year</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4 text-center">Disability</th>
                  <th className="p-4 text-right">Income</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4 text-center">Nashik MC</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(student.id)}
                        onChange={() => handleSelectRow(student.id)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                      />
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-white">{student.student_name}</td>
                    <td className="p-4"><span className="px-2 py-1 rounded bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-bold">{student.category}</span></td>
                    <td className="p-4"><span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-350 text-xs font-semibold">{formatBranch(student.branch)}</span></td>
                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{student.percentage}%</td>
                    <td className="p-4 text-slate-500 dark:text-slate-450">{student.year}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-450">{student.gender}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${student.disability === 'Yes' ? 'bg-red-500/10 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {student.disability}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-600 dark:text-slate-400">₹{Number(student.income).toLocaleString()}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-455">{student.mobile}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${student.nashik_municipal_corporation === 'Yes' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {student.nashik_municipal_corporation}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 space-x-1.5 whitespace-nowrap">
                      <button 
                        onClick={() => handleOpenProfile(student)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors"
                        title="View Profile"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(student)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-violet-500 hover:text-violet-600 transition-colors"
                        title="Edit Record"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 hover:text-red-600 transition-colors"
                        title="Delete Record"
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
          <div className="py-20 text-center text-sm text-slate-400">No student records match search filters.</div>
        )}

        {/* Pagination Bar */}
        {!loading && totalCount > 0 && (
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, totalCount)} of {totalCount} records
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors text-slate-655 dark:text-slate-350"
              >
                Prev
              </button>
              <span className="px-3 py-1 bg-violet-600/10 text-violet-500 text-xs font-bold rounded-lg flex items-center justify-center">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors text-slate-655 dark:text-slate-350"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {currentStudent ? 'Edit Student Record' : 'Add New Student Record'}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Student Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">STUDENT NAME</label>
                <input
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('student_name', { required: 'Student Name is required' })}
                />
                {errors.student_name && <span className="text-[10px] text-red-400">{errors.student_name.message}</span>}
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">CATEGORY</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('category', { required: 'Category is required' })}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.category_name}>{c.category_name}</option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">BRANCH</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('branch', { required: 'Branch is required' })}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.branch_name}>{b.branch_name} ({b.branch_code})</option>
                  ))}
                </select>
                {errors.branch && <span className="text-[10px] text-red-400">{errors.branch.message}</span>}
              </div>

              {/* Percentage */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">PERCENTAGE (%)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Enter academic percentage score"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('percentage', { required: 'Percentage is required', min: { value: 0, message: 'Invalid percentage' }, max: { value: 100, message: 'Invalid percentage' } })}
                />
                {errors.percentage && <span className="text-[10px] text-red-400">{errors.percentage.message}</span>}
              </div>

              {/* Year */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">YEAR</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('year', { required: 'Year of study is required' })}
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                </select>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">GENDER</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('gender', { required: 'Gender is required' })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Disability */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">PHYSICAL DISABILITY</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('disability', { required: 'Disability flag is required' })}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {/* Annual Income */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">ANNUAL INCOME (₹)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Enter annual family income"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('income', { required: 'Annual Income is required', min: { value: 0, message: 'Invalid income' } })}
                />
                {errors.income && <span className="text-[10px] text-red-400">{errors.income.message}</span>}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">MOBILE NUMBER</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('mobile', { 
                    required: 'Mobile is required',
                    pattern: { value: /^[0-9]{10}$/, message: 'Must be exactly 10 digits' }
                  })}
                />
                {errors.mobile && <span className="text-[10px] text-red-400">{errors.mobile.message}</span>}
              </div>

              {/* Nashik Municipal Resident */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">RESIDENT UNDER NASHIK MUNICIPAL CORPORATION</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('nashik_municipal_corporation', { required: 'Nashik residency check is required' })}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-350 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Detail Modal */}
      {showProfileModal && profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Student Admission Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center font-bold text-2xl text-violet-600 dark:text-violet-400">
                  {profileStudent.student_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">{profileStudent.student_name}</h4>
                  <p className="text-xs text-slate-455 mt-0.5">{formatBranch(profileStudent.branch)} | {profileStudent.year}</p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profileStudent.category}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Gender</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profileStudent.gender}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Merit Percentage (%)</p>
                  <p className="font-bold text-violet-500 mt-0.5">{profileStudent.percentage}%</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Annual Income</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">₹{Number(profileStudent.income).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Disability Quota</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profileStudent.disability}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Nashik Municipal Resident</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{profileStudent.nashik_municipal_corporation}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Mobile Number</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{profileStudent.mobile}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Upload Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Import Students Excel</h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleImportExcel} className="p-6 space-y-4">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Please upload an Excel spreadsheet matching the exact column layout schema:
                <br />
                <strong>Name, Category, Branch, Percentage(%), Year, Gender, Disability(Yes/No), Annual Income, Mobile Number, Nashik Resident(Yes/No).</strong>
              </p>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-850 hover:border-violet-500 rounded-2xl p-6 text-center cursor-pointer relative group transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FiUpload className="w-8 h-8 text-slate-400 group-hover:text-violet-500 mx-auto mb-2" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-350 block">
                  {importFile ? importFile.name : 'Select Excel spreadsheet'}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">Maximum size 5MB</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportFile(null);
                    setShowImportModal(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-350 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="flex-1 py-2.5 bg-violet-650 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-colors flex justify-center items-center shadow-lg shadow-violet-650/10"
                >
                  {importing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Upload & Import'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
