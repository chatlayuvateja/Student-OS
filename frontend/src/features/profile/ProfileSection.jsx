import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useProfile, useUpdateProfile, useUploadPhoto } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function ProfileSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const fileInputRef = useRef(null);

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
    e.preventDefault();
    updateProfile.mutate(form);
    setEditing(false);
  };

  const rawPhotoUrl = profile?.profile_photo_url;
  const photoUrl = rawPhotoUrl
    ? rawPhotoUrl.startsWith('http') ? rawPhotoUrl : `http://localhost:3001${rawPhotoUrl}`
    : null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadPhoto.mutate(file);
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">You</p>
            <h2 className="section-heading">Student *profile*</h2>
            <p className="section-subtext">Manage your personal information.</p>
          </div>
          <button onClick={() => setEditing(!editing)} className="btn-primary text-xs px-5 py-2.5">
            {editing ? 'View' : '✏️ Edit'}
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
                    <input type="text" placeholder="Subjects (comma separated)" value={form.subjects?.join(', ') || ''} onChange={e => setForm(p => ({ ...p, subjects: e.target.value.split(',').map(s => s.trim()) }))}
                      className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={updateProfile.isPending}
                      className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                      {updateProfile.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
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
                  {profile?.subjects?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider">Subjects</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profile.subjects.map((s, i) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded-md bg-stroke/50 text-muted">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfileSection;
