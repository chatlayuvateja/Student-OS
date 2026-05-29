import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useProfile, useUpdateProfile,
  useSettings, useUpdateSettings,
  useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useCollegeCalendar, useCreateCollegeEvent,
  useDownloadBackup, useResetBackup,
} from '../../hooks/api';
import toast from 'react-hot-toast';

const FILE_LIST = [
  { value: 'profile.json', label: 'Profile', icon: '👤' },
  { value: 'courses.json', label: 'Courses / CGPA', icon: '📚' },
  { value: 'timetable.json', label: 'Timetable', icon: '📅' },
  { value: 'habits.json', label: 'Habits', icon: '✅' },
  { value: 'focus_sessions.json', label: 'Focus Sessions', icon: '🎯' },
  { value: 'attendance_records.json', label: 'Attendance Records', icon: '📋' },
  { value: 'notes.json', label: 'Notes / Class Notes', icon: '📝' },
  { value: 'sticky_notes.json', label: 'Sticky Notes', icon: '🗒️' },
  { value: 'resources.json', label: 'Resources', icon: '🔗' },
  { value: 'roadmaps.json', label: 'Roadmaps', icon: '🧭' },
  { value: 'semesters.json', label: 'Semesters', icon: '📆' },
  { value: 'subjects.json', label: 'Subjects', icon: '📖' },
  { value: 'settings.json', label: 'Settings', icon: '⚙️' },
  { value: 'attendance_settings.json', label: 'Attendance Settings', icon: '📊' },
];

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Europe/Moscow',
  'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Dubai',
  'Australia/Sydney', 'Pacific/Auckland', 'Africa/Cairo', 'America/Sao_Paulo',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsSection({ isOpen, onClose }) {
  // Profile
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [profileForm, setProfileForm] = useState({});

  // Settings
  const { data: appSettings } = useSettings();
  const updateSettings = useUpdateSettings();

  // Subjects
  const { data: subjects = [] } = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  // Backup / Reset
  const downloadBackup = useDownloadBackup();
  const resetBackup = useResetBackup();

  // Calendar
  const { data: calendarEvents = [] } = useCollegeCalendar();

  // Accordion state
  const [openSection, setOpenSection] = useState(null);

  // Subject form
  const [subjectForm, setSubjectForm] = useState({ name: '', semester: '', professor: '', color: '#6366f1' });
  const [editingSubject, setEditingSubject] = useState(null);

  // Period form
  const [periodForm, setPeriodForm] = useState({ name: '', start_time: '09:00', end_time: '10:00' });
  const [editingPeriod, setEditingPeriod] = useState(null);

  // Calendar
  const createCollegeEvent = useCreateCollegeEvent();
  const [calForm, setCalForm] = useState({ title: '', type: 'semester', start_date: '', end_date: '', color: '#89AACC' });

  // Reset confirmation
  const [resetConfirm, setResetConfirm] = useState({ filename: '', confirmText: '' });

  // Focus defaults form
  const [focusForm, setFocusForm] = useState({ pomodoro_duration: 25, break_duration: 5 });

  // Working days form
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]);

  // Attendance settings form
  const [attendanceSettings, setAttendanceSettings] = useState({
    minimum_threshold: 75,
    count_bunks_as_absent: true,
  });

  useEffect(() => {
    if (profile) setProfileForm(profile);
  }, [profile]);

  useEffect(() => {
    if (appSettings) {
      setFocusForm({
        pomodoro_duration: appSettings.focus_defaults?.pomodoro_duration || 25,
        break_duration: appSettings.focus_defaults?.break_duration || 5,
      });
      setWorkingDays(appSettings.working_days || [1, 2, 3, 4, 5]);
      setAttendanceSettings({
        minimum_threshold: appSettings.attendance_threshold || 75,
        count_bunks_as_absent: appSettings.attendance_count_bunks_as_absent !== false,
      });
    }
  }, [appSettings]);

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key);
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(profileForm, {
      onSuccess: () => toast.success('Profile settings saved'),
    });
  };

  const handleSaveFocusDefaults = () => {
    updateSettings.mutate({
      focus_defaults: {
        pomodoro_duration: parseInt(focusForm.pomodoro_duration),
        break_duration: parseInt(focusForm.break_duration),
      },
    });
  };

  const handleSaveWorkingDays = () => {
    updateSettings.mutate({ working_days: workingDays });
  };

  const handleSaveAttendanceSettings = () => {
    updateSettings.mutate({
      attendance_threshold: parseInt(attendanceSettings.minimum_threshold),
      attendance_count_bunks_as_absent: attendanceSettings.count_bunks_as_absent,
    });
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (editingSubject) {
      updateSubject.mutate({ id: editingSubject.id, ...subjectForm });
    } else {
      createSubject.mutate(subjectForm);
    }
    setSubjectForm({ name: '', semester: '', professor: '', color: '#6366f1' });
    setEditingSubject(null);
  };

  const handleEditSubject = (subj) => {
    setSubjectForm({ name: subj.name, semester: subj.semester || '', professor: subj.professor || '', color: subj.color || '#6366f1' });
    setEditingSubject(subj);
  };

  const handleDeleteSubject = (id) => {
    deleteSubject.mutate(id);
  };

  const handlePeriodSave = (e) => {
    e.preventDefault();
    if (periodForm.name && periodForm.start_time && periodForm.end_time) {
      const periods = appSettings?.custom_periods || [];
      let updated;
      if (editingPeriod) {
        updated = periods.map(p => p.name === editingPeriod.name ? { name: periodForm.name, start_time: periodForm.start_time, end_time: periodForm.end_time } : p);
      } else {
        updated = [...periods, { name: periodForm.name, start_time: periodForm.start_time, end_time: periodForm.end_time }];
      }
      updateSettings.mutate({ custom_periods: updated });
      setPeriodForm({ name: '', start_time: '09:00', end_time: '10:00' });
      setEditingPeriod(null);
    }
  };

  const handleDeletePeriod = (name) => {
    const periods = (appSettings?.custom_periods || []).filter(p => p.name !== name);
    updateSettings.mutate({ custom_periods: periods });
  };

  const handleResetFile = (filename) => {
    resetBackup.mutate({ filename, confirm: `reset-${filename}` });
    setResetConfirm({ filename: '', confirmText: '' });
  };

  const AccordionSection = ({ id, title, icon, children }) => (
    <div className="border-b border-stroke/60 last:border-b-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-all hover:bg-surface/30"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-text-primary">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${openSection === id ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {openSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const Input = ({ label, ...props }) => (
    <div>
      {label && <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">{label}</label>}
      <input
        className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all"
        {...props}
      />
    </div>
  );

  const Select = ({ label, children, ...props }) => (
    <div>
      {label && <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">{label}</label>}
      <select
        className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all"
        {...props}
      >
        {children}
      </select>
    </div>
  );

  const ToggleButton = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-text-primary text-bg'
          : 'bg-surface border border-stroke text-muted hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative glass-card-strong w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stroke flex-shrink-0">
              <div>
                <p className="text-xs text-muted uppercase tracking-[0.2em]">Settings</p>
                <h2 className="text-xl font-display italic text-text-primary mt-0.5">App *configuration*</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stroke/50 transition-all text-muted hover:text-text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4L4 12M4 4l8 8" />
                </svg>
              </button>
            </div>

            {/* Accordion Body - scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* 1. Profile Settings */}
              <AccordionSection id="profile" title="Profile Settings" icon="👤">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <Input label="Name" value={profileForm.name || ''} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                  <Input label="College" value={profileForm.college || ''} onChange={e => setProfileForm(p => ({ ...p, college: e.target.value }))} />
                  <Input label="Semester" type="number" value={profileForm.semester || ''} onChange={e => setProfileForm(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))} />
                  <Input label="Year" type="number" value={profileForm.year || ''} onChange={e => setProfileForm(p => ({ ...p, year: parseInt(e.target.value) || 1 }))} />
                  <Input label="GPA Scale" type="number" step="0.1" value={profileForm.gpa_scale || ''} onChange={e => setProfileForm(p => ({ ...p, gpa_scale: parseFloat(e.target.value) || 4.0 }))} />
                  <Select label="Timezone" value={profileForm.timezone || ''} onChange={e => setProfileForm(p => ({ ...p, timezone: e.target.value }))}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </Select>
                  <Input label="Attendance Threshold (%)" type="number" value={profileForm.attendance_threshold || ''} onChange={e => setProfileForm(p => ({ ...p, attendance_threshold: parseInt(e.target.value) || 75 }))} />
                  <Input label="Daily Focus Goal (hours)" type="number" step="0.5" value={profileForm.focus_goal || ''} onChange={e => setProfileForm(p => ({ ...p, focus_goal: parseFloat(e.target.value) || 4 }))} />
                </div>
                <button onClick={handleSaveProfile} disabled={updateProfile.isPending}
                  className="btn-primary text-xs px-6 py-2.5 disabled:opacity-40">
                  {updateProfile.isPending ? 'Saving...' : 'Save Profile Settings'}
                </button>
              </AccordionSection>

              {/* 2. Subject Management */}
              <AccordionSection id="subjects" title="Subject Management" icon="📖">
                <form onSubmit={handleAddSubject} className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input placeholder="Subject name" value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} required />
                    <Input placeholder="Semester" value={subjectForm.semester} onChange={e => setSubjectForm(p => ({ ...p, semester: e.target.value }))} />
                    <Input placeholder="Professor (optional)" value={subjectForm.professor} onChange={e => setSubjectForm(p => ({ ...p, professor: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs px-5 py-2">
                      {editingSubject ? 'Update Subject' : 'Add Subject'}
                    </button>
                    {editingSubject && (
                      <button type="button" onClick={() => { setSubjectForm({ name: '', semester: '', professor: '', color: '#6366f1' }); setEditingSubject(null); }}
                        className="px-4 py-2 rounded-xl text-xs text-muted border border-stroke hover:text-text-primary transition-all">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                {subjects.length === 0 ? (
                  <p className="text-xs text-muted italic">No subjects added yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {subjects.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-stroke">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: sub.color || '#6366f1' }} />
                          <div>
                            <span className="text-sm text-text-primary">{sub.name}</span>
                            {sub.semester && <span className="text-[10px] text-muted ml-2">Sem {sub.semester}</span>}
                            {sub.professor && <span className="text-[10px] text-muted ml-2">· {sub.professor}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditSubject(sub)} className="text-[10px] text-muted hover:text-text-primary transition-all">✏️</button>
                          <button onClick={() => handleDeleteSubject(sub.id)} className="text-[10px] text-muted hover:text-red-400 transition-all">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionSection>

              {/* 3. Timetable Configuration */}
              <AccordionSection id="timetable" title="Timetable Configuration" icon="🕐">
                <p className="text-xs text-muted mb-3">Select working days:</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {WEEKDAYS.map((day, idx) => (
                    <ToggleButton
                      key={idx}
                      active={workingDays.includes(idx)}
                      onClick={() => {
                        setWorkingDays(prev =>
                          prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                        );
                      }}
                    >
                      {day.slice(0, 3)}
                    </ToggleButton>
                  ))}
                </div>
                <button onClick={handleSaveWorkingDays} disabled={updateSettings.isPending}
                  className="btn-primary text-xs px-5 py-2 disabled:opacity-40 mb-6">
                  Save Working Days
                </button>

                <p className="text-xs text-muted mb-3">Custom class periods (name, start, end):</p>
                <form onSubmit={handlePeriodSave} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <Input placeholder="Period name" value={periodForm.name} onChange={e => setPeriodForm(p => ({ ...p, name: e.target.value }))} required />
                  <Input type="time" value={periodForm.start_time} onChange={e => setPeriodForm(p => ({ ...p, start_time: e.target.value }))} required />
                  <Input type="time" value={periodForm.end_time} onChange={e => setPeriodForm(p => ({ ...p, end_time: e.target.value }))} required />
                  <button type="submit" className="btn-primary text-xs px-4 py-2.5">
                    {editingPeriod ? 'Update' : 'Add Period'}
                  </button>
                </form>
                {editingPeriod && (
                  <button onClick={() => { setPeriodForm({ name: '', start_time: '09:00', end_time: '10:00' }); setEditingPeriod(null); }}
                    className="text-[10px] text-muted hover:text-text-primary mb-3">Cancel editing</button>
                )}

                {(appSettings?.custom_periods || []).length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(appSettings.custom_periods || []).map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-stroke">
                        <span className="text-sm text-text-primary">{p.name} <span className="text-muted text-xs">{p.start_time} – {p.end_time}</span></span>
                        <div className="flex gap-2">
                          <button onClick={() => { setPeriodForm({ name: p.name, start_time: p.start_time, end_time: p.end_time }); setEditingPeriod(p); }}
                            className="text-[10px] text-muted hover:text-text-primary">✏️</button>
                          <button onClick={() => handleDeletePeriod(p.name)}
                            className="text-[10px] text-muted hover:text-red-400">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionSection>

              {/* 4. Attendance Settings */}
              <AccordionSection id="attendance-settings" title="Attendance Settings" icon="📊">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input label="Minimum Attendance (%)" type="number" min="0" max="100"
                    value={attendanceSettings.minimum_threshold}
                    onChange={e => setAttendanceSettings(p => ({ ...p, minimum_threshold: e.target.value }))} />
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">Count bunks as absent?</label>
                    <div className="flex gap-2">
                      <ToggleButton
                        active={attendanceSettings.count_bunks_as_absent === true}
                        onClick={() => setAttendanceSettings(p => ({ ...p, count_bunks_as_absent: true }))}
                      >
                        Yes
                      </ToggleButton>
                      <ToggleButton
                        active={attendanceSettings.count_bunks_as_absent === false}
                        onClick={() => setAttendanceSettings(p => ({ ...p, count_bunks_as_absent: false }))}
                      >
                        No
                      </ToggleButton>
                    </div>
                  </div>
                </div>
                <button onClick={handleSaveAttendanceSettings} disabled={updateSettings.isPending}
                  className="btn-primary text-xs px-5 py-2.5 disabled:opacity-40">
                  Save Attendance Settings
                </button>
              </AccordionSection>

              {/* 5. Academic Calendar */}
              <AccordionSection id="calendar" title="Academic Calendar" icon="📆">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (calForm.title && calForm.start_date) {
                    createCollegeEvent.mutate(calForm, {
                      onSuccess: () => setCalForm({ title: '', type: 'semester', start_date: '', end_date: '', color: '#89AACC' }),
                    });
                  }
                }} className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Event title" value={calForm.title} onChange={e => setCalForm(p => ({ ...p, title: e.target.value }))} required />
                    <Select value={calForm.type} onChange={e => setCalForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="semester">Semester</option>
                      <option value="exam">Exam Period</option>
                      <option value="holiday">Holiday</option>
                      <option value="event">Other Event</option>
                    </Select>
                    <Input type="date" label="Start Date" value={calForm.start_date} onChange={e => setCalForm(p => ({ ...p, start_date: e.target.value }))} required />
                    <Input type="date" label="End Date" value={calForm.end_date} onChange={e => setCalForm(p => ({ ...p, end_date: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={createCollegeEvent.isPending}
                    className="btn-primary text-xs px-5 py-2.5 disabled:opacity-40">
                    {createCollegeEvent.isPending ? 'Adding...' : 'Add Event'}
                  </button>
                </form>

                {calendarEvents.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {calendarEvents.slice(-10).reverse().map(evt => (
                      <div key={evt.id} className="px-3.5 py-2.5 rounded-xl bg-surface border border-stroke">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: evt.color || '#89AACC' }} />
                          <span className="text-sm text-text-primary">{evt.title || evt.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stroke/50 text-muted uppercase">{evt.type}</span>
                        </div>
                        {evt.start_date && (
                          <p className="text-[10px] text-muted mt-1">{evt.start_date}{evt.end_date ? ` → ${evt.end_date}` : ''}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionSection>

              {/* 6. Focus Session Defaults */}
              <AccordionSection id="focus" title="Focus Session Defaults" icon="🎯">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input label="Pomodoro Duration (minutes)" type="number" min="1" max="120"
                    value={focusForm.pomodoro_duration}
                    onChange={e => setFocusForm(p => ({ ...p, pomodoro_duration: e.target.value }))} />
                  <Input label="Break Duration (minutes)" type="number" min="1" max="30"
                    value={focusForm.break_duration}
                    onChange={e => setFocusForm(p => ({ ...p, break_duration: e.target.value }))} />
                </div>
                <button onClick={handleSaveFocusDefaults} disabled={updateSettings.isPending}
                  className="btn-primary text-xs px-5 py-2.5 disabled:opacity-40">
                  Save Focus Defaults
                </button>
              </AccordionSection>

              {/* 7. Data Management */}
              <AccordionSection id="data" title="Data Management" icon="💾">
                <div className="space-y-5">
                  {/* Export */}
                  <div>
                    <p className="text-sm font-medium text-text-primary mb-1">Export All Data</p>
                    <p className="text-xs text-muted mb-3">Download a ZIP backup of all your data files.</p>
                    <button onClick={downloadBackup} className="btn-primary text-xs px-5 py-2.5">
                      📦 Download Backup ZIP
                    </button>
                  </div>

                  <div className="border-t border-stroke/60" />

                  {/* Reset individual files */}
                  <div>
                    <p className="text-sm font-medium text-text-primary mb-1">Reset Individual Data</p>
                    <p className="text-xs text-muted mb-3">Select a file to reset and type the confirmation below.</p>

                    <Select
                      value={resetConfirm.filename}
                      onChange={e => setResetConfirm(p => ({ ...p, filename: e.target.value }))}
                    >
                      <option value="">— Select a file to reset —</option>
                      {FILE_LIST.map(f => (
                        <option key={f.value} value={f.value}>{f.icon} {f.label}</option>
                      ))}
                    </Select>

                    {resetConfirm.filename && (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted">
                          Type <span className="font-mono text-[#FF6B6B] bg-stroke/50 px-1.5 py-0.5 rounded">reset-{resetConfirm.filename}</span> to confirm:
                        </p>
                        <Input
                          placeholder={`Type reset-${resetConfirm.filename} to confirm`}
                          value={resetConfirm.confirmText}
                          onChange={e => setResetConfirm(p => ({ ...p, confirmText: e.target.value }))}
                        />
                        <button
                          onClick={() => handleResetFile(resetConfirm.filename)}
                          disabled={resetConfirm.confirmText !== `reset-${resetConfirm.filename}` || resetBackup.isPending}
                          className="px-5 py-2.5 rounded-xl text-xs font-medium text-[#FF6B6B] border border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {resetBackup.isPending ? 'Resetting...' : '⚠️ Reset Data'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionSection>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
