import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiFileText, FiDownload, FiInfo, FiLayers, FiUsers, FiHome } from 'react-icons/fi';

export default function Reports() {
  const [genderFilter, setGenderFilter] = React.useState('Male');
  
  const reportsList = [
    { 
      id: 'merit', 
      title: 'Academic Merit List', 
      desc: 'Sorted ranks of all candidate applications based on merit percentage and tie-breaking metrics.', 
      icon: FiUsers,
      color: 'text-violet-500 bg-violet-500/10'
    },
    { 
      id: 'allotment', 
      title: 'Hostel Seat Allotments', 
      desc: 'Active student allotments mapping candidates to specific hostels, buildings, and seat numbers.', 
      icon: FiHome,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    { 
      id: 'occupancy', 
      title: 'Hostel Seat Occupancy', 
      desc: 'Current occupancy metrics of hostels listing total capacities, occupied seats, and remaining beds.', 
      icon: FiHome,
      color: 'text-cyan-500 bg-cyan-500/10'
    },
  ];

  // Auth file downloads (PDF/Excel)
  const downloadReport = async (format, reportType) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} file...`, { id: 'rep-toast' });
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
      toast.success('File downloaded successfully.', { id: 'rep-toast' });
    } catch (err) {
      toast.error('Failed to prepare report file.', { id: 'rep-toast' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Reports Center</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate official print-ready PDF reports and spreadsheets for institutional audits.</p>
        </div>
        
        {/* Boys / Girls Segregation Toggle Buttons */}
        <div className="flex bg-slate-550/10 dark:bg-slate-900/40 p-1 rounded-xl gap-2 w-48 border border-slate-200/50 dark:border-slate-800/80">
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
      </div>

      {/* Grid of 3 Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {reportsList.map((rep) => (
          <div key={rep.id} className="p-6 glass-card flex flex-col justify-between space-y-4 hover:border-violet-550/30 transition-all duration-200 h-full">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${rep.color}`}>
                  <rep.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{rep.title}</h3>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-450 leading-relaxed">{rep.desc}</p>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <button
                onClick={() => downloadReport('pdf', rep.id)}
                className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-red-650/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/10"
              >
                <FiFileText className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={() => downloadReport('excel', rep.id)}
                className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-emerald-650/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition-all border border-emerald-500/10"
              >
                <FiDownload className="w-4 h-4" /> Download Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Information Banner */}
      <div className="p-4 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex gap-3 text-violet-500">
        <FiInfo className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">Generating Official Institutional Forms</h4>
          <p className="text-slate-500 dark:text-slate-450">All PDF reports generated contain professional institutional structures, aligned tables, page numbering, and dates. Ensure system settings (College Name & Academic Year) are correct before downloads.</p>
        </div>
      </div>
    </div>
  );
}
