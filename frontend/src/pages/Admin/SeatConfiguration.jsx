import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiX, FiSliders, FiEdit3, FiHome, FiCheck, FiAlertTriangle } from 'react-icons/fi';

export default function SeatConfiguration() {
  const [activeTab, setActiveTab] = useState('seats');
  const [loading, setLoading] = useState(true);

  // Data states
  const [configs, setConfigs] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Selection options
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hostels, setHostels] = useState([]);

  // Modals state
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // React Hook Forms
  const { register: registerSeat, handleSubmit: handleSubmitSeat, reset: resetSeat, formState: { errors: seatErrors } } = useForm();
  const { register: registerRoom, handleSubmit: handleSubmitRoom, reset: resetRoom, setValue: setRoomValue, formState: { errors: roomErrors } } = useForm();

  const fetchConfigs = async () => {
    try {
      const res = await axios.get('/api/seat-configuration');
      if (res.data.success) {
        setConfigs(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load seat configurations.');
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get('/api/rooms');
      if (res.data.success) {
        setRooms(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load rooms list.');
    }
  };

  const fetchOptions = async () => {
    try {
      const [bRes, cRes, hRes] = await Promise.all([
        axios.get('/api/branches'),
        axios.get('/api/categories'),
        axios.get('/api/hostels')
      ]);
      if (bRes.data.success) setBranches(bRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
      if (hRes.data.success) setHostels(hRes.data.data);
    } catch (err) {
      toast.error('Failed to load configuration options.');
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchConfigs(), fetchRooms(), fetchOptions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Seat Quota Submission
  const onSubmitSeatForm = async (data) => {
    try {
      data.seat_count = parseInt(data.seat_count);
      const res = await axios.post('/api/seat-configuration', data);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowSeatModal(false);
        fetchConfigs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration.');
    }
  };

  const handleDeleteSeat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this seat configuration?')) return;
    try {
      const res = await axios.delete(`/api/seat-configuration/${id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchConfigs();
      }
    } catch (err) {
      toast.error('Failed to delete configuration.');
    }
  };

  // Room Submission
  const onSubmitRoomForm = async (data) => {
    try {
      data.floor = parseInt(data.floor) || 1;
      data.capacity = parseInt(data.capacity);
      data.is_active = data.is_active === true;
      
      let res;
      if (editingRoom) {
        res = await axios.put(`/api/rooms/${editingRoom.id}`, data);
      } else {
        res = await axios.post('/api/rooms', data);
      }

      if (res.data.success) {
        toast.success(res.data.message);
        setShowRoomModal(false);
        setEditingRoom(null);
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room.');
    }
  };

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    resetRoom({
      hostel_id: '',
      room_number: '',
      floor: 1,
      capacity: 4,
      status: 'Active',
      gender: 'Male',
      room_type: 'Normal',
      is_active: true
    });
    setShowRoomModal(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    resetRoom({
      hostel_id: room.hostel_id,
      room_number: room.room_number,
      floor: room.floor,
      capacity: room.capacity,
      status: room.status,
      gender: room.gender,
      room_type: room.room_type,
      is_active: room.is_active
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (room) => {
    if ((room.occupied || 0) > 0) {
      toast.error('Cannot delete room as students are already allotted here.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete room '${room.room_number}'?`)) return;
    try {
      const res = await axios.delete(`/api/rooms/${room.id}`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRooms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Seat & Room Setup</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure seats quotas branch-wise or manage specific rooms in residential hostels.</p>
        </div>
        <div>
          {activeTab === 'seats' ? (
            <button
              onClick={() => {
                resetSeat({ branch_id: '', category_id: '', hostel_id: '', seat_count: '' });
                setShowSeatModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all w-full sm:w-auto justify-center"
            >
              <FiPlus /> Configure Seats Quota
            </button>
          ) : (
            <button
              onClick={handleOpenAddRoom}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all w-full sm:w-auto justify-center"
            >
              <FiPlus /> Add Hostel Room
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 p-1.5 rounded-xl gap-2 max-w-md">
        <button
          onClick={() => setActiveTab('seats')}
          className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
            activeTab === 'seats'
              ? 'bg-white dark:bg-slate-800 shadow text-violet-600 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Seats Quotas
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 text-center text-sm font-bold rounded-lg transition-all ${
            activeTab === 'rooms'
              ? 'bg-white dark:bg-slate-800 shadow text-violet-600 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          Room Management
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-650"></div>
          <span className="text-sm text-slate-400">Loading data...</span>
        </div>
      ) : activeTab === 'seats' ? (
        /* Seats Quota Tab content */
        <div className="glass-card overflow-hidden">
          {configs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Branch</th>
                    <th className="p-4">Category Quota</th>
                    <th className="p-4">Hostel Building</th>
                    <th className="p-4 text-center">Seat Count</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {configs.map((cfg) => (
                    <tr key={cfg.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 pl-6 font-semibold">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold">
                          {cfg.branches ? `${cfg.branches.branch_name} (${cfg.branches.branch_code})` : 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-white">
                        <span className="px-2.5 py-1 rounded bg-violet-650/10 text-violet-500 font-extrabold text-xs">
                          {cfg.categories?.category_name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-450">{cfg.hostels?.hostel_name} ({cfg.hostels?.gender})</td>
                      <td className="p-4 text-center font-extrabold text-violet-650 text-base">{cfg.seat_count}</td>
                      <td className="p-4 text-right pr-6">
                        <button 
                          onClick={() => handleDeleteSeat(cfg.id)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-red-500/10 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                          title="Remove Configuration"
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
            <div className="py-20 text-center text-sm text-slate-400">No seat quotas configured. Click Configure Seats Quota above.</div>
          )}
        </div>
      ) : (
        /* Room Management Tab content */
        <div className="glass-card overflow-hidden">
          {rooms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">Room Number</th>
                    <th className="p-4">Hostel Building</th>
                    <th className="p-4">Floor</th>
                    <th className="p-4">Gender</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-center">Beds (Filled/Total)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {rooms.map((room) => {
                    const available = (room.capacity || 0) - (room.occupied || 0);
                    return (
                      <tr key={room.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white">
                          <span className="flex items-center gap-2">
                            <FiHome className="text-violet-500" />
                            {room.room_number}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold">{room.hostels?.hostel_name || 'N/A'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">Floor {room.floor}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            room.gender === 'Male' ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-500'
                          }`}>
                            {room.gender}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            room.room_type === 'Accessible' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400'
                          }`}>
                            {room.room_type}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-extrabold text-slate-800 dark:text-white">{room.occupied} / {room.capacity}</span>
                            <span className="text-[10px] font-semibold text-slate-400">{available} beds left</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            room.status === 'Active' && room.is_active ? 'bg-emerald-500/10 text-emerald-500' :
                            room.status === 'Maintenance' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {room.status === 'Active' && room.is_active ? 'Active' : room.status}
                          </span>
                        </td>
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditRoom(room)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-violet-500/10 dark:bg-slate-800 text-slate-500 hover:text-violet-500 transition-colors"
                              title="Edit Room"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room)}
                              className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-500/10 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
                              title="Delete Room"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-slate-400">No rooms configured yet. Click Add Hostel Room to start.</div>
          )}
        </div>
      )}

      {/* Seat Modal */}
      {showSeatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Configure Seats Quota</h3>
              <button onClick={() => setShowSeatModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSeat(onSubmitSeatForm)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">COLLEGE BRANCH</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...registerSeat('branch_id', { required: 'Please select a branch' })}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch_name} ({b.branch_code})</option>
                  ))}
                </select>
                {seatErrors.branch_id && <span className="text-[10px] text-red-400">{seatErrors.branch_id.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">RESERVATION CATEGORY</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...registerSeat('category_id', { required: 'Please select a category' })}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.category_name} ({c.reservation_percentage}%)</option>
                  ))}
                </select>
                {seatErrors.category_id && <span className="text-[10px] text-red-400">{seatErrors.category_id.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">HOSTEL BUILDING</label>
                <select
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                  {...registerSeat('hostel_id', { required: 'Please select a hostel' })}
                >
                  <option value="">Select Hostel</option>
                  {hostels.map(h => (
                    <option key={h.id} value={h.id}>{h.hostel_name} ({h.gender})</option>
                  ))}
                </select>
                {seatErrors.hostel_id && <span className="text-[10px] text-red-400">{seatErrors.hostel_id.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">TOTAL SEAT COUNT</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                  {...registerSeat('seat_count', { required: 'Seat count is required', min: 0 })}
                />
                {seatErrors.seat_count && <span className="text-[10px] text-red-400">{seatErrors.seat_count.message}</span>}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowSeatModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-350 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingRoom ? 'Edit Room' : 'Add Room to Hostel'}
              </h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRoom(onSubmitRoomForm)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">HOSTEL BUILDING</label>
                <select
                  disabled={!!editingRoom}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer disabled:opacity-50"
                  {...registerRoom('hostel_id', { required: 'Please select a hostel' })}
                  onChange={(e) => {
                    const host = hostels.find(h => h.id === e.target.value);
                    if (host) {
                      setRoomValue('gender', host.gender === 'Female' ? 'Female' : 'Male');
                    }
                  }}
                >
                  <option value="">Select Hostel</option>
                  {hostels.map(h => (
                    <option key={h.id} value={h.id}>{h.hostel_name} ({h.gender})</option>
                  ))}
                </select>
                {roomErrors.hostel_id && <span className="text-[10px] text-red-400">{roomErrors.hostel_id.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">ROOM NUMBER</label>
                  <input
                    disabled={!!editingRoom}
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 disabled:opacity-50"
                    {...registerRoom('room_number', { required: 'Room number is required' })}
                  />
                  {roomErrors.room_number && <span className="text-[10px] text-red-400">{roomErrors.room_number.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">FLOOR</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                    {...registerRoom('floor', { required: 'Floor is required', min: 0 })}
                  />
                  {roomErrors.floor && <span className="text-[10px] text-red-400">{roomErrors.floor.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">BED CAPACITY</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                    {...registerRoom('capacity', { 
                      required: 'Capacity is required', 
                      min: { value: editingRoom ? editingRoom.occupied : 1, message: `Capacity cannot be less than occupied beds (${editingRoom?.occupied || 0})` }
                    })}
                  />
                  {roomErrors.capacity && <span className="text-[10px] text-red-400">{roomErrors.capacity.message}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">ROOM GENDER</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                    {...registerRoom('gender', { required: 'Gender matches room students type' })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">ROOM TYPE</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                    {...registerRoom('room_type')}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Accessible">Accessible (Disability Care)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">STATUS</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500 cursor-pointer"
                    {...registerRoom('status')}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  className="rounded text-violet-650 focus:ring-violet-650"
                  {...registerRoom('is_active')}
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-550 dark:text-slate-400 cursor-pointer select-none">
                  Available for allocation (Active Status)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-350 text-sm font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-violet-650 hover:bg-violet-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-md"
                >
                  {editingRoom ? 'Save Room Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
