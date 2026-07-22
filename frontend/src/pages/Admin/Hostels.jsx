import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit3, FiTrash2, FiX, FiActivity, FiUserCheck, FiHome } from 'react-icons/fi';

export default function Hostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state control
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [currentHostel, setCurrentHostel] = useState(null); // null for Add, hostel obj for Edit

  // Form Hooks
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchHostels = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/hostels');
      if (res.data.success) {
        setHostels(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load hostels list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  const onSubmitForm = async (data) => {
    try {
      let res;
      // Parse integers
      data.capacity = parseInt(data.capacity);
      data.floors = parseInt(data.floors);

      if (currentHostel) {
        res = await axios.put(`/api/hostels/${currentHostel.id}`, data);
      } else {
        res = await axios.post('/api/hostels', data);
      }

      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddEditModal(false);
        fetchHostels();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hostel.');
    }
  };

  const handleOpenAdd = () => {
    setCurrentHostel(null);
    reset({
      hostel_name: '',
      gender: 'Male',
      building: '',
      floors: 1,
      capacity: '',
      status: 'Active'
    });
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (hostel) => {
    setCurrentHostel(hostel);
    reset(hostel);
    setShowAddEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hostel? All associated allotments and seat configs will be lost.')) return;
    try {
      const res = await axios.delete(`/api/hostels/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchHostels();
      }
    } catch (err) {
      toast.error('Failed to delete hostel.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Hostel Buildings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure residential facilities, building properties, and check current occupancy rates.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-550 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
        >
          <FiPlus /> Add Hostel Building
        </button>
      </div>

      {/* Grid of Hostels */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-600"></div>
          <span className="text-sm text-slate-400">Loading hostels list...</span>
        </div>
      ) : hostels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel) => {
            const utilization = Math.min(100, Math.round(((hostel.occupied || 0) / (hostel.capacity || 1)) * 100));
            return (
              <div key={hostel.id} className="glass-card p-6 flex flex-col justify-between space-y-5 relative overflow-hidden group">
                {/* Gender Tag Accent */}
                <div className={`absolute top-0 right-0 h-1.5 w-1/3 ${
                  hostel.gender === 'Male' ? 'bg-blue-500' :
                  hostel.gender === 'Female' ? 'bg-pink-500' : 'bg-purple-500'
                }`} />

                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{hostel.hostel_name}</h3>
                      <p className="text-xs text-slate-400 font-semibold uppercase">{hostel.building} | Floors: {hostel.floors}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      hostel.gender === 'Male' ? 'bg-blue-500/10 text-blue-500' :
                      hostel.gender === 'Female' ? 'bg-pink-500/10 text-pink-500' :
                      'bg-purple-500/10 text-purple-500'
                    }`}>
                      {hostel.gender}
                    </span>
                  </div>

                  {/* Occupancy stats */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800/60 py-2.5">
                      <div>Total Rooms: <span className="text-slate-800 dark:text-white font-extrabold">{hostel.totalRooms || 0}</span></div>
                      <div>Total Beds: <span className="text-slate-800 dark:text-white font-extrabold">{hostel.totalBeds || hostel.capacity || 0}</span></div>
                      <div>Occupied: <span className="text-slate-800 dark:text-white font-extrabold text-violet-500">{hostel.occupiedBeds || hostel.occupied || 0}</span></div>
                      <div>Available: <span className="text-slate-800 dark:text-white font-extrabold text-emerald-500">{hostel.availableBeds !== undefined ? hostel.availableBeds : hostel.remaining}</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span>Seat Utilization</span>
                        <span>{utilization}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            utilization >= 90 ? 'bg-red-500' :
                            utilization >= 75 ? 'bg-amber-500' :
                            'bg-emerald-500'
                          }`} 
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${hostel.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-slate-400 font-semibold">{hostel.status}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(hostel)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-violet-500/10 dark:bg-slate-800 text-slate-500 hover:text-violet-500 transition-colors"
                      title="Edit"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hostel.id)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-500/10 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center glass-card text-sm text-slate-450">No hostels configured yet. Add residential buildings above.</div>
      )}

      {/* Add / Edit Hostel Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {currentHostel ? 'Edit Hostel Building' : 'Add Hostel Building'}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">HOSTEL NAME</label>
                <input
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('hostel_name', { required: 'Hostel name is required' })}
                />
                {errors.hostel_name && <span className="text-[10px] text-red-400">{errors.hostel_name.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">GENDER TYPE</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('gender', { required: 'Gender allocation type is required' })}
                >
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                  <option value="Co-Ed">Co-Ed (Shared)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">BUILDING / BLOCK NAME</label>
                <input
                  placeholder="e.g. Block A, Sector 2"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...register('building', { required: 'Building block is required' })}
                />
                {errors.building && <span className="text-[10px] text-red-400">{errors.building.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">TOTAL FLOORS</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                    {...register('floors', { required: 'Floors count required', min: 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">TOTAL CAPACITY</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                    {...register('capacity', { required: 'Capacity is required', min: 1 })}
                  />
                  {errors.capacity && <span className="text-[10px] text-red-400">{errors.capacity.message}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">HOSTEL STATUS</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...register('status')}
                >
                  <option value="Active">Active / Operational</option>
                  <option value="Inactive">Inactive / Renovation</option>
                </select>
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
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
