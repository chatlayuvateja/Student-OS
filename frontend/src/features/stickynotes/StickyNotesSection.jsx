import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStickyNotes, useCreateStickyNote, useUpdateStickyNote, useDeleteStickyNote } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const NOTE_COLORS = ['#1a1a2e', '#2d1b69', '#1a3a4a', '#3d1f1f', '#1a3d2e'];

function StickyNotesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', color: '#1a1a2e', is_pinned: false, subject_tag: '' });

  const { data: notes = [] } = useStickyNotes();
  const createNote = useCreateStickyNote();
  const updateNote = useUpdateStickyNote();
  const deleteNote = useDeleteStickyNote();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    createNote.mutate(form);
    setShowModal(false);
    setForm({ title: '', content: '', color: '#1a1a2e', is_pinned: false, subject_tag: '' });
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Quick Notes</p>
            <h2 className="section-heading">Sticky *notes*</h2>
            <p className="section-subtext">Jot down quick ideas.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-5 py-2.5">
            + Add Note
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notes.map(note => (
            <div key={note.id}
              className="glass-card p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              style={{ borderLeft: `3px solid ${note.color || '#89AACC'}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-text-primary truncate">{note.title || 'Untitled'}</p>
                <button onClick={() => deleteNote.mutate(note.id)}
                  className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[10px] flex-shrink-0 ml-2">✕</button>
              </div>
              <p className="text-xs text-muted line-clamp-4">{note.content}</p>
              {note.subject_tag && (
                <span className="inline-block mt-2 text-[9px] px-1.5 py-0.5 rounded bg-stroke/50 text-muted">{note.subject_tag}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-6">New Sticky Note</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <textarea rows={4} placeholder="Write your note..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all resize-none" />
              <input type="text" placeholder="Subject tag" value={form.subject_tag} onChange={e => setForm(p => ({ ...p, subject_tag: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <div>
                <p className="text-xs text-muted mb-2">Color</p>
                <div className="flex gap-2">
                  {NOTE_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setForm(p => ({ ...p, color }))}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === color ? 'ring-2 ring-text-primary ring-offset-2 ring-offset-bg' : ''}`}
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createNote.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                  {createNote.isPending ? 'Creating...' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default StickyNotesSection;
