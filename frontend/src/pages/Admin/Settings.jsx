import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiSliders, FiLock, FiDatabase, FiUpload, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { admin } = useAuth();
  
  // States
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState(null);

  // Form Hooks
  const { register: regSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings } = useForm();
  const { register: regPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch } = useForm();

  // Load existing settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success && res.data.data) {
        resetSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load system settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings
  const onSaveSettings = async (data) => {
    setSavingSettings(true);
    try {
      const res = await axios.put('/api/settings', data);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchSettings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Password
  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await axios.put('/api/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
      });
      if (res.data.success) {
        toast.success(res.data.message);
        resetPassword({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Download DB Backup
  const handleDownloadBackup = async () => {
    try {
      toast.loading('Exporting database tables...', { id: 'back-toast' });
      const res = await axios.get('/api/settings/backup', { responseType: 'blob' });
      
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `autoallot_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast.success('Database backup exported.', { id: 'back-toast' });
    } catch (err) {
      toast.error('Backup generation failed.', { id: 'back-toast' });
    }
  };

  // Restore DB Backup
  const handleRestoreBackup = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      toast.error('Please select a JSON backup file to upload.');
      return;
    }

    if (!window.confirm('WARNING: Restoring will overwrite all existing tables, seat configurations, allotments, and students. Do you want to proceed?')) return;

    setRestoring(true);
    const formData = new FormData();
    formData.append('file', backupFile);

    try {
      const res = await axios.post('/api/settings/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setBackupFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Database restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title Panel */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">System Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure platform properties, update passwords, and perform system backups.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Institutional Settings */}
          <div className="p-6 glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
              <FiSliders className="w-5 h-5 text-violet-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Institutional Profiles</h3>
            </div>
            
            {settingsLoading ? (
              <div className="py-10 text-center animate-pulse space-y-2">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3"></div>
              </div>
            ) : (
              <form onSubmit={handleSettingsSubmit(onSaveSettings)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">COLLEGE / INSTITUTION NAME</label>
                  <input
                    placeholder="AutoAllot Engineering College"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-850 border border-transparent rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                    {...regSettings('college_name', { required: true })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">CURRENT ACADEMIC YEAR</label>
                  <input
                    placeholder="2026-27"
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-850 border border-transparent rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                    {...regSettings('academic_year', { required: true })}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-550 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center"
                  >
                    {savingSettings ? 'Saving...' : 'Save College Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Backup & Restore */}
          <div className="p-6 glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
              <FiDatabase className="w-5 h-5 text-violet-500" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Database Backup & Recovery</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-500 dark:text-slate-400">
              
              {/* Backup Card */}
              <div className="p-4 bg-slate-100/50 dark:bg-slate-850/40 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-700 dark:text-slate-350">Download Data Dump</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Package all branches, categories, configured rooms, student details, waiting records, and activity logs into a portable JSON backup file.</p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all text-xs"
                >
                  <FiDownload /> Export DB JSON
                </button>
              </div>

              {/* Restore Card */}
              <form onSubmit={handleRestoreBackup} className="p-4 bg-slate-100/50 dark:bg-slate-850/40 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-700 dark:text-slate-350">Restore from File</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">Import and reconstruct database tables using a previously downloaded JSON backup file. WARNING: Clears existing records.</p>
                </div>
                
                <div className="space-y-3.5">
                  <div className="relative border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-center cursor-pointer text-[11px] font-semibold text-slate-400">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => setBackupFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <span>{backupFile ? backupFile.name : 'Select JSON backup'}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={restoring}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-550 disabled:bg-violet-850 text-white font-semibold rounded-xl transition-all text-xs"
                  >
                    <FiUpload /> {restoring ? 'Restoring tables...' : 'Restore DB JSON'}
                  </button>
                </div>
              </form>

            </div>
          </div>

        </div>

        {/* Change Password Column */}
        <div className="p-6 glass-card space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
            <FiLock className="w-5 h-5 text-violet-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Admin Credentials</h3>
          </div>

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">OLD PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-855 border border-transparent rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                {...regPassword('oldPassword', { required: true })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">NEW PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-855 border border-transparent rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                {...regPassword('newPassword', { required: true, minLength: 6 })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">CONFIRM NEW PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-855 border border-transparent rounded-xl outline-none text-sm text-slate-800 dark:text-white focus:border-violet-500"
                {...regPassword('confirmPassword', { required: true })}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 bg-violet-650 hover:bg-violet-600 disabled:bg-violet-850 text-white rounded-xl text-xs font-bold transition-all shadow-md flex justify-center items-center"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
