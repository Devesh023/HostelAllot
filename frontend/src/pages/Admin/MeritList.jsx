import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FiAward, FiFileText, FiDownload, FiSearch, 
  FiFilter, FiLayers, FiList, FiClock, FiSettings 
} from 'react-icons/fi';

export default function MeritList() {
  const [activeTab, setActiveTab] = useState('merit'); // 'merit' or 'allotted'
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Ranks & Allotment lists
  const [merits, setMerits] = useState([]);
  const [allotments, setAllotments] = useState([]);

  // Search & Filter state
  const [searchVal, setSearchVal] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genderFilter, setGenderFilter] = useState('Male');

  const formatBranch = (branchVal) => {
    if (!branchVal) return '';
    const branchObj = branches.find(b => b.branch_name === branchVal || b.branch_code === branchVal);
    if (!branchObj) return branchVal;
    return `${branchObj.branch_name} (${branchObj.branch_code})`;
  };

  const fetchLists = async () => {
    setLoading(true);
    try {
      const [meritRes, allotRes, bRes, cRes] = await Promise.all([
        axios.get('/api/merit'),
        axios.get('/api/merit/allotments'),
        axios.get('/api/branches'),
        axios.get('/api/categories')
      ]);

      if (meritRes.data.success) {
        setMerits(meritRes.data.data);
      }
      if (allotRes.data.success) {
        setAllotments(allotRes.data.data);
      }
      if (bRes.data.success) setBranches(bRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
    } catch (err) {
      toast.error('Failed to load merit list details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // Trigger Allotment Algorithm
  const handleGenerateAllotment = async () => {
    if (generating) return;
    if (!window.confirm('Generating merit will archive all existing allotments and run the allocation rules. Do you want to proceed?')) return;
    
    setGenerating(true);
    try {
      const res = await axios.post('/api/merit/generate-merit');
      if (res.data.success) {
        toast.success('Merit List Generated Successfully');
        await fetchLists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allotment generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  // Auth file downloads (PDF/Excel)
  const downloadReport = async (format, reportType) => {
    try {
      toast.loading(`Downloading ${format.toUpperCase()} report...`);
      const res = await axios.get(`/api/reports/${format}`, {
        params: { 
          type: reportType,
          gender: genderFilter
        },
        responseType: 'blob'
      });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `report_${reportType}_${genderFilter}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
      toast.dismiss();
      toast.success('Report downloaded.');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to download report.');
    }
  };

  // Sort merits ALWAYS Highest Percentage -> Lowest Percentage
  const sortedMerits = [...merits].sort((a, b) => {
    const pctA = parseFloat(a.marks !== undefined ? a.marks : a.students?.percentage || 0);
    const pctB = parseFloat(b.marks !== undefined ? b.marks : b.students?.percentage || 0);
    if (pctB !== pctA) return pctB - pctA;
    const nameA = a.students?.student_name || '';
    const nameB = b.students?.student_name || '';
    return nameA.localeCompare(nameB);
  });

  // Filter merit list in-memory
  const filteredMeritList = sortedMerits.filter(item => {
    const student = item.students || {};
    const genderMatch = student.gender === genderFilter;
    const nameMatch = student.student_name?.toLowerCase().includes(searchVal.toLowerCase());
    const branchMatch = branchFilter ? (student.branch === branchFilter || formatBranch(student.branch).includes(branchFilter)) : true;
    const categoryMatch = categoryFilter ? student.category === categoryFilter : true;
    return genderMatch && nameMatch && branchMatch && categoryMatch;
  });

  // Filter allotments in-memory
  const filteredAllotments = allotments.filter(item => {
    const student = item.students || {};
    const genderMatch = student.gender === genderFilter;
    const nameMatch = student.student_name?.toLowerCase().includes(searchVal.toLowerCase());
    const branchMatch = branchFilter ? (student.branch === branchFilter || formatBranch(student.branch).includes(branchFilter)) : true;
    const categoryMatch = categoryFilter ? student.category === categoryFilter : true;
    return genderMatch && nameMatch && branchMatch && categoryMatch;
  });

  const totalMeritsForGender = merits.filter(item => item.students?.gender === genderFilter).length;
  const totalAllottedForGender = allotments.filter(item => item.students?.gender === genderFilter).length;

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Allotment board</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Execute seat allocation programs, view ranked merits, and manage seat allotments.</p>
        </div>
        <button
          onClick={handleGenerateAllotment}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-550 disabled:bg-violet-850 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-violet-650/20 transition-all active:scale-[0.99] disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <FiAward className="w-5 h-5" />
              <span>Generate Merit & Allotment</span>
            </>
          )}
        </button>
      </div>

      {/* Boys / Girls Segregation Toggle Buttons */}
      <div className="flex border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 p-1 rounded-xl gap-2 max-w-xs">
        <button
          onClick={() => setGenderFilter('Male')}
          className={`flex-1 py-1.5 text-center text-xs font-extrabold rounded-lg transition-all ${
            genderFilter === 'Male'
              ? 'bg-white dark:bg-slate-800 shadow text-violet-650 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          BOYS
        </button>
        <button
          onClick={() => setGenderFilter('Female')}
          className={`flex-1 py-1.5 text-center text-xs font-extrabold rounded-lg transition-all ${
            genderFilter === 'Female'
              ? 'bg-white dark:bg-slate-800 shadow text-violet-650 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350'
          }`}
        >
          GIRLS
        </button>
      </div>

      {/* Tabs Toggle & Reports Download Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-1">
        <div className="flex gap-2 text-sm font-bold">
          <button
            onClick={() => setActiveTab('merit')}
            className={`px-4 py-2.5 rounded-t-xl transition-all ${
              activeTab === 'merit' 
                ? 'bg-violet-600/10 text-violet-500 border-b-2 border-violet-500 font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Academic Merit List ({totalMeritsForGender})
          </button>
          <button
            onClick={() => setActiveTab('allotted')}
            className={`px-4 py-2.5 rounded-t-xl transition-all ${
              activeTab === 'allotted' 
                ? 'bg-violet-600/10 text-violet-500 border-b-2 border-violet-500 font-extrabold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hostel Seat Allotments ({totalAllottedForGender})
          </button>
        </div>

        {/* Report downloads */}
        <div className="flex flex-wrap gap-2 text-xs font-bold self-end md:self-auto mb-2 md:mb-0">
          <button
            onClick={() => downloadReport('pdf', activeTab === 'allotted' ? 'allotment' : 'merit')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
          >
            <FiFileText /> Export PDF
          </button>
          <button
            onClick={() => downloadReport('excel', activeTab === 'allotted' ? 'allotment' : 'merit')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-250 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
          >
            <FiDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* List Filter Tools */}
      <div className="p-4 glass-card grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="relative col-span-1 sm:col-span-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search by Student Name..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/60 border border-transparent rounded-xl outline-none focus:border-violet-500 text-slate-800 dark:text-white"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.branch_name}>{b.branch_name} ({b.branch_code})</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent rounded-xl outline-none text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.category_name}>{c.category_name}</option>
          ))}
        </select>
      </div>

      {/* Main Table view */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600"></div>
            <span className="text-sm text-slate-400">Loading merit list records...</span>
          </div>
        ) : activeTab === 'merit' ? (
          filteredMeritList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6 text-center w-24">Rank</th>
                    <th className="p-4 text-left">Student Name</th>
                    <th className="p-4 text-left">Gender</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-left">Branch</th>
                    <th className="p-4 pr-6 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {filteredMeritList.map((item, index) => {
                    const student = item.students || {};
                    const pct = item.marks !== undefined ? item.marks : student.percentage;
                    return (
                      <tr key={item.id || index} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-6 text-center font-extrabold text-violet-500">#{item.rank || index + 1}</td>
                        <td className="p-4 text-left font-semibold text-slate-800 dark:text-white">{student.student_name || 'N/A'}</td>
                        <td className="p-4 text-left text-slate-600 dark:text-slate-350">{student.gender || 'N/A'}</td>
                        <td className="p-4 text-left"><span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-bold">{student.category || 'N/A'}</span></td>
                        <td className="p-4 text-left"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold">{formatBranch(student.branch)}</span></td>
                        <td className="p-4 pr-6 text-right font-extrabold text-slate-800 dark:text-white">{Number(pct || 0).toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-slate-400">No merit list entries found. Click Generate Merit & Allotment above.</div>
          )
        ) : (
          filteredAllotments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Student Name</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Branch</th>
                    <th className="p-4">Hostel Allotted</th>
                    <th className="p-4">Room No</th>
                    <th className="p-4 text-center">Seat Number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {filteredAllotments.map((allot) => {
                    const student = allot.students || {};
                    const hostel = allot.hostels || {};
                    return (
                      <tr key={allot.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-slate-800 dark:text-white">{student.student_name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-350">{student.gender}</td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-bold">{student.category}</span></td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold">{formatBranch(student.branch)}</span></td>
                        <td className="p-4 font-semibold">{hostel.hostel_name}</td>
                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{allot.rooms?.room_number || 'N/A'}</td>
                        <td className="p-4 text-center"><span className="px-3 py-1 bg-emerald-600/10 text-emerald-500 text-xs font-bold rounded-lg border border-emerald-500/20">{allot.seat_number}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-slate-400">No active student allotments found. Generate merit list above.</div>
          )
        )}
      </div>
    </div>
  );
}
