import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useProfile, useUpdateProfile, useUploadPhoto } from '../../hooks/api';
import ConfirmDialog from '../../components/ConfirmDialog';

gsap.registerPlugin(ScrollTrigger);

const SUBJECT_COLORS = ['#6366f1', '#00C2A8', '#F5A623', '#FF6B6B', '#8B5CF6', '#3B1FA8', '#89AACC', '#4E85BF', '#1fa87a', '#e91e63'];

function normalizeSubject(sub) {
  if (typeof sub === 'string') return { name: sub, color: SUBJECT_COLORS[sub.length % SUBJECT_COLORS.length] };
  return { name: sub.name || '', color: sub.color || SUBJECT_COLORS[0] };
}

function normalizeSubjects(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return [];
  return subjects.map(normalizeSubject);
}

function ProfileSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0]);
  const [confirmNewSem, setConfirmNewSem] = useState(false);
  const fileInputRef = useRef(null);
  const addInputRef = useRef(null);

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadPhoto();

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSave = (e) => {
    if (e) e.preventDefault();
    updateProfile.mutate(
      {
        ...form,
        subjects: (form.subjects || []).map(s =>
          typeof s === 'string' ? { name: s, color: SUBJECT_COLORS[s.length % SUBJECT_COLORS.length] } : s
        ),
      },
      {
        onSuccess: () => setEditing(false),
        onError: () => {},
      }
    );
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) setForm(profile);
    setNewSubjectName('');
  };

  const rawPhotoUrl = profile?.profile_photo_url;
  const photoUrl = rawPhotoUrl
    ? rawPhotoUrl.startsWith('http') ? rawPhotoUrl : `http://localhost:3001${rawPhotoUrl}`
    : null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto.mutate(file);
  };

  // --- Subject management (edit mode) ---

  const addSubject = () => {
    const name = newSubjectName.trim();
    if (!name) return;
    const current = Array.isArray(form.subjects) ? form.subjects.map(normalizeSubject) : [];
    setForm(p => ({ ...p, subjects: [...current, { name, color: newSubjectColor }] }));
    setNewSubjectName('');
    setNewSubjectColor(SUBJECT_COLORS[0]);
    setTimeout(() => addInputRef.current?.focus(), 0);
  };

  const removeSubject = (index) => {
    const current = Array.isArray(form.subjects) ? form.subjects.map(normalizeSubject) : [];
    setForm(p => ({ ...p, subjects: current.filter((_, i) => i !== index) }));
  };

  const updateSubjectColor = (index, color) => {
    const current = (form.subjects || []).map(normalizeSubject);
    current[index] = { ...current[index], color };
    setForm(p => ({ ...p, subjects: current }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubject();
    }
  };

  // --- New semester ---

  const handleNewSemester = () => {
    setForm(p => ({ ...p, subjects: [] }));
    setConfirmNewSem(false);
    updateProfile.mutate(
      { ...form, subjects: [] },
      { onError: () => {} }
    );
  };

  const displaySubjects = normalizeSubjects(profile?.subjects);
  const editSubjects = Array.isArray(form.subjects) ? form.subjects.map(normalizeSubject) : [];

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">You</p>
            <h2 className="section-heading">Student *profile*</h2>
            <p className="section-subtext">Manage your personal information.</p>
          </div>
          <button onClick={() => editing ? handleSave() : setEditing(true)} className="btn-primary text-xs px-5 py-2.5">
            {editing ? '💾 Save' : '✏️ Edit'}
          </button>
        </div>

        <div className="glass-card p-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl bg-surface border border-stroke overflow-hidden relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl font-display italic text-muted">
                      {profile?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white">Upload</span>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Name" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                    <input type="text" placeholder="College" value={form.college || ''} onChange={e => setForm(p => ({ ...p, college: e.target.value }))}
                      className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                    <input type="number" placeholder="Semester" value={form.semester || ''} onChange={e => setForm(p => ({ ...p, semester: Number(e.target.value) }))}
                      className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                  </div>

                  {/* Editable Subject List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted uppercase tracking-wider">Subjects</span>
                    </div>

                    <div className="space-y-1.5 mb-2">
                      {editSubjects.map((sub, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-stroke">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <input type="color" value={sub.color}
                              onChange={e => updateSubjectColor(i, e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border-0 p-0 flex-shrink-0"
                              title="Pick a color tag" />
                            <span className="text-sm text-text-primary truncate">{sub.name}</span>
                          </div>
                          <button type="button" onClick={() => removeSubject(i)}
                            className="text-muted hover:text-red-400 transition-all text-xs flex-shrink-0 p-1">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Subject Row */}
                    <div className="flex items-center gap-2">
                      <input ref={addInputRef}
                        type="text" placeholder="Add a subject..." value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-3 py-2 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                      <input type="color" value={newSubjectColor}
                        onChange={e => setNewSubjectColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 flex-shrink-0" />
                      <button type="button" onClick={addSubject}
                        className="px-3 py-2 rounded-xl text-xs font-medium text-bg bg-text-primary hover:opacity-90 transition-all flex-shrink-0">
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={updateProfile.isPending}
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                      {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={handleCancel}
                      className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider">Name</p>
                    <p className="text-lg font-medium text-text-primary">{profile?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider">College</p>
                    <p className="text-base text-text-primary">{profile?.college || 'Not set'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider">Semester</p>
                      <p className="text-base text-text-primary">{profile?.semester || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider">Year</p>
                      <p className="text-base text-text-primary">{profile?.year || 'Not set'}</p>
                    </div>
                  </div>

                  {/* Subjects Display + New Semester */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted uppercase tracking-wider">Subjects</p>
                      {displaySubjects.length > 0 && (
                        <button onClick={() => setConfirmNewSem(true)}
                          className="text-[10px] text-[#89AACC] hover:text-[#4E85BF] transition-all font-medium">
                          + New Semester
                        </button>
                      )}
                    </div>
                    {displaySubjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {displaySubjects.map((s, i) => (
                          <span key={i}
                            className="text-[10px] px-2.5 py-1 rounded-md font-medium"
                            style={{ background: s.color + '18', color: s.color, borderLeft: `3px solid ${s.color}` }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-center p-4 rounded-xl bg-surface/50 border border-dashed border-stroke">
                        <p className="text-xs text-muted italic">No subjects added yet.</p>
                        <button onClick={() => setEditing(true)}
                          className="mt-2 text-[10px] text-[#89AACC] hover:text-[#4E85BF] transition-all font-medium">
                          + Add subjects
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Semester Confirmation */}
      <ConfirmDialog
        isOpen={confirmNewSem}
        onClose={() => setConfirmNewSem(false)}
        onConfirm={handleNewSemester}
        title="New Semester"
        message={`Start a new semester? This will clear all current subjects (${displaySubjects.length} subjects). You can add new subjects afterward.`}
        confirmText="Clear & Start New"
        variant="danger"
      />
    </section>
  );
}

export default ProfileSection;
