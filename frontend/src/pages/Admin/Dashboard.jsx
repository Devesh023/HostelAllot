import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUsers, FiHome, FiLayers, FiList, FiClock, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load dashboard statistics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  if (!stats) return null;

  const cardData = [
    { name: 'Total Students', value: stats.totalStudents, icon: FiUsers, color: 'text-violet-500 bg-violet-500/10' },
    { name: 'Total Hostels', value: stats.totalHostels, icon: FiHome, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Hostel Rooms', value: stats.totalRooms || 0, desc: `${stats.totalRooms || 0} Rooms Configured`, icon: FiHome, color: 'text-pink-500 bg-pink-500/10' },
    { name: 'Bed Occupancy', value: `${stats.filledSeats} / ${stats.totalSeats}`, desc: `${stats.remainingSeats} Beds Available`, icon: FiLayers, color: 'text-emerald-500 bg-emerald-500/10' },
    { name: 'Waitlist Candidates', value: stats.waitingStudents, icon: FiList, color: 'text-amber-500 bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Dashboard Overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time statistics and analysis of hostel seat metrics.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {cardData.map((card, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            key={card.name}
            className="p-6 glass-card flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</span>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</h3>
              {card.desc && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{card.desc}</p>}
            </div>
            <div className={`p-4 rounded-2xl ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity logs & audit logs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-6 glass-card space-y-5"
      >
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
          <FiActivity className="w-5 h-5 text-violet-500" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white font-sans">Recent System Activities</h3>
            <p className="text-xs text-slate-400">Audit logs tracking updates made by administration staff.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto space-y-3.5 pr-2">
          {stats.latestActivities && stats.latestActivities.length > 0 ? (
            stats.latestActivities.map((act) => (
              <div key={act.id} className="flex justify-between items-start pt-3.5 first:pt-0">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-350">{act.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">By admin: <span className="font-semibold">{act.admin}</span></p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  {new Date(act.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-slate-400">No activities logged yet.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
