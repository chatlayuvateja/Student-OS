import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import toast from 'react-hot-toast';
import { useProfile, useUpdateProfile, useDownloadBackup } from '../../hooks/api';
import api from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function ProfileSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const downloadBackup = useDownloadBackup();
  const [form, setForm] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        college: profile.college || '',
        semester: profile.semester || 1,
        year: profile.year || 1,
        gpa_scale: profile.gpa_scale || 4.0,
        focus_goal: profile.focus_goal || 4,
        attendance_threshold: profile.attendance_threshold || 75,
        timezone: profile.timezone || 'America/New_York',
      });
    }
  }, [profile]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateProfile.mutate(form);
    setIsDirty(false);
  };

  const handleReset = async (filename) => {
    try {
      await api.delete(`/backup/reset/${filename}`, { data: { confirm: `reset-${filename}` } });
      toast.success(`Reset ${filename}`);
      setResetConfirm(null);
    } catch (err) {
      toast.error('Reset failed');
    }
  };

  if (isLoading) {
    return (
      <section ref={sectionRef} className="py-28 lg:py-36">
        <div className="section-container">
          <div className="skeleton h-96 w-full" />
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 bg-gradient-to-b from-cream via-indigo-50/20 to-ivory">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Customize<br />Your OS</h2>
          <p className="section-subtitle mt-4">Everything you need to configure your experience.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Personal Info */}
          <div className="glass-card-strong p-6">
            <h3 className="text-lg font-display font-semibold mb-6" style={{ color: '#1a1a2e' }}>Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Name</label>
                <input value={form.name || ''} onChange={e => handleChange('name', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">College</label>
                <input value={form.college || ''} onChange={e => handleChange('college', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Semester</label>
                <input type="number" value={form.semester || 1} onChange={e => handleChange('semester', parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" min={1} max={12} />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Year</label>
                <input type="number" value={form.year || 1} onChange={e => handleChange('year', parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" min={1} max={6} />
              </div>
            </div>
          </div>

          {/* Academic Settings */}
          <div className="glass-card-strong p-6">
            <h3 className="text-lg font-display font-semibold mb-6" style={{ color: '#1a1a2e' }}>Academic Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">GPA Scale</label>
                <select value={form.gpa_scale || 4.0} onChange={e => handleChange('gpa_scale', parseFloat(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm">
                  <option value={4.0}>4.0 Scale</option>
                  <option value={10.0}>10.0 Scale</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Focus Goal (pomodoros/day)</label>
                <input type="number" value={form.focus_goal || 4} onChange={e => handleChange('focus_goal', parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" min={1} max={20} />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Attendance Threshold (%)</label>
                <input type="number" value={form.attendance_threshold || 75} onChange={e => handleChange('attendance_threshold', parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" min={50} max={100} />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Timezone</label>
                <select value={form.timezone || 'America/New_York'} onChange={e => handleChange('timezone', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm">
                  <option value="America/New_York">Eastern Time (US)</option>
                  <option value="America/Chicago">Central Time (US)</option>
                  <option value="America/Denver">Mountain Time (US)</option>
                  <option value="America/Los_Angeles">Pacific Time (US)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="glass-card-strong p-6">
            <h3 className="text-lg font-display font-semibold mb-4" style={{ color: '#1a1a2e' }}>Data Management</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={downloadBackup} className="px-5 py-3 rounded-2xl text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all">
                ⬇️ Download Backup
              </button>
              {['timetable', 'habits', 'class_notes', 'focus_sessions'].map(file => (
                <div key={file}>
                  <button onClick={() => setResetConfirm(file)} className="px-5 py-3 rounded-2xl text-sm font-medium bg-red-50 text-red-400 hover:bg-red-100 transition-all">
                    🗑️ Reset {file.replace('_', ' ')}
                  </button>
                  {resetConfirm === file && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-red-400">Confirm reset?</p>
                      <button onClick={() => handleReset(file)} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500 text-white">Yes</button>
                      <button onClick={() => setResetConfirm(null)} className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-400">No</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="glass-card-strong p-6">
            <h3 className="text-lg font-display font-semibold mb-4" style={{ color: '#1a1a2e' }}>Subjects</h3>
            <p className="text-xs text-indigo-400/60 mb-3">Enter your subjects separated by commas.</p>
            <input
              value={(form.subjects || []).join(', ')}
              onChange={e => handleChange('subjects', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm"
              placeholder="Data Structures, Algorithms, Mathematics, Physics"
            />
          </div>
        </div>

        {/* Floating Save Button */}
        {isDirty && (
          <div className="fixed bottom-8 right-8 z-40 animate-bounce">
            <button onClick={handleSave}
              className="px-8 py-4 rounded-2xl text-sm font-medium text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl"
              style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}
            >
              💾 Save All Changes
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfileSection;
