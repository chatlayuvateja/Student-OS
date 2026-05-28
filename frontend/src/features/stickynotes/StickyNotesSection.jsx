import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStickyNotes, useCreateStickyNote, useUpdateStickyNote, useDeleteStickyNote } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const NOTE_COLORS = ['#FFF8E1', '#FFE0F0', '#EDE0FF', '#E0FFF5', '#FFEDE0'];

function StickyNote({ note, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  const handleBlur = () => {
    setIsEditing(false);
    if (content !== note.content) {
      onUpdate({ id: note.id, content });
    }
  };

  return (
    <div
      className="group relative p-5 rounded-2xl transition-all duration-300 cursor-default"
      style={{
        background: note.color || NOTE_COLORS[0],
        transform: `rotate(${(note.rotation || Math.random() * 4 - 2)}deg)`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        minHeight: '120px',
      }}
      onMouseEnter={(e) => {
        gsap.to(e.currentTarget, { rotate: 0, scale: 1.02, y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)', duration: 0.3, ease: 'power2.out' });
      }}
      onMouseLeave={(e) => {
        gsap.to(e.currentTarget, { rotate: note.rotation || 0, scale: 1, y: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', duration: 0.3, ease: 'power2.out' });
      }}
    >
      {note.is_pinned && <span className="text-xs absolute -top-1 -right-1">📌</span>}
      {note.title && <h4 className="text-sm font-semibold mb-2" style={{ color: '#1a1a2e' }}>{note.title}</h4>}
      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-transparent text-sm outline-none resize-none"
          style={{ color: '#1a1a2e' }}
          autoFocus
        />
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(26,26,46,0.7)' }}
          onClick={() => setIsEditing(true)}>
          {note.content}
        </p>
      )}
      {note.subject_tag && <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/50 text-indigo-400">{note.subject_tag}</span>}
      <button
        onClick={() => {
          gsap.to(`#note-${note.id}`, { y: -20, opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => onDelete(note.id) });
        }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-400/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

function StickyNotesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', color: NOTE_COLORS[0], subject_tag: '' });

  const { data: notes = [] } = useStickyNotes();
  const createNote = useCreateStickyNote();
  const updateNote = useUpdateStickyNote();
  const deleteNote = useDeleteStickyNote();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll('.note-card');
        gsap.fromTo(items, { y: -60, opacity: 0, rotate: -5 }, {
          y: 0, opacity: 1, rotate: 0, stagger: 0.05, duration: 0.6, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: gridRef.current, start: 'top 80%' },
        });
      }
    });
    return () => ctx.revert();
  }, [notes]);

  const handleAdd = (e) => {
    e.preventDefault();
    createNote.mutate({ ...form, rotation: Math.random() * 4 - 2 });
    setForm({ title: '', content: '', color: NOTE_COLORS[0], subject_tag: '' });
    setShowAdd(false);
  };

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Thoughts,<br />Captured</h2>
          <p className="section-subtitle mt-4">Your ideas, your way. Quick notes that stick.</p>
          <button onClick={() => setShowAdd(true)} className="mt-6 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)', color: 'white' }}>+ New Note</button>
        </div>

        {/* Masonry grid */}
        <div ref={gridRef} className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {notes.map((note) => (
            <div key={note.id} id={`note-${note.id}`} className="note-card break-inside-avoid">
              <StickyNote note={note} onDelete={deleteNote.mutate} onUpdate={updateNote.mutate} />
            </div>
          ))}
          {notes.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-4xl mb-4">📝</p>
              <p className="text-indigo-400/40">No notes yet. Click "+ New Note" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">New Note</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="Note title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Content</label>
                <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm resize-none" rows={4} placeholder="Write something..." required />
              </div>
              <div className="flex gap-2">
                {NOTE_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-indigo-400 scale-110' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>Save</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default StickyNotesSection;
