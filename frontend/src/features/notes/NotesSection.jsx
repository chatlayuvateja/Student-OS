import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function NotesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedNote, setExpandedNote] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', subject: '' });
  const [editingNote, setEditingNote] = useState(null);
  const [examMode, setExamMode] = useState(false);
  const searchTimeout = useRef(null);

  const { data: notes = [] } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const subjects = useMemo(() => {
    const s = new Set(notes.map(n => n.subject).filter(Boolean));
    return [...s];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q))
      );
    }
    if (selectedSubject) {
      result = result.filter(n => n.subject === selectedSubject);
    }
    return result;
  }, [notes, search, selectedSubject]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      gsap.fromTo(gridRef.current.querySelectorAll('.note-card'), { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, stagger: 0.04, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
      });
    }
  }, [filteredNotes]);

  const handleSearch = (e) => {
    const value = e.target.value;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(value), 300);
  };

  const handleCreate = () => {
    setEditingNote(null);
    setEditForm({ title: '', content: '', subject: '' });
    setShowEditor(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setEditForm({ title: note.title, content: note.content, subject: note.subject });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, ...editForm });
    } else {
      createNote.mutate(editForm);
    }
    setShowEditor(false);
    setEditingNote(null);
  };

  const handleDelete = (id) => {
    deleteNote.mutate(id);
    setExpandedNote(null);
  };

  const truncate = (text, max = 100) => text && text.length > max ? text.slice(0, max) + '...' : text;

  return (
    <section ref={sectionRef} className={`relative py-28 lg:py-36 transition-all duration-500 ${examMode ? 'bg-ivory' : 'bg-gradient-to-b from-cream via-soft-peach/20 to-cream'}`}>
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Your Knowledge<br />Library</h2>
          <p className="section-subtitle mt-4">Everything you've learned, beautifully organized.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <input
              onChange={handleSearch}
              placeholder="Search notes..."
              className="px-5 py-3 rounded-2xl bg-white border border-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none text-sm w-64 transition-all"
            />
            <button onClick={handleCreate} className="px-6 py-3 rounded-2xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
              + New Note
            </button>
            <button onClick={() => setExamMode(!examMode)} className={`px-4 py-3 rounded-2xl text-sm font-medium transition-all ${examMode ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-400 border border-indigo-100'}`}>
              {examMode ? '📖 Exam Mode On' : '📖 Exam Mode'}
            </button>
          </div>
          {/* Subject filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={() => setSelectedSubject(null)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!selectedSubject ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
              All
            </button>
            {subjects.map(s => (
              <button key={s} onClick={() => setSelectedSubject(s === selectedSubject ? null : s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${s === selectedSubject ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-400 border border-indigo-50'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Notes grid */}
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <div key={note.id} className={`note-card glass-card p-5 hover-lift cursor-pointer transition-all duration-300 ${examMode ? 'bg-white' : ''}`}
              onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
            >
              <div className="w-full h-1 rounded-full mb-4" style={{ background: note.color || 'linear-gradient(90deg, #3B1FA8, #6B3FFF)' }} />
              <h4 className="text-sm font-semibold mb-2" style={{ color: '#1a1a2e' }}>{note.title || 'Untitled'}</h4>
              <p className="text-xs text-indigo-400/60 leading-relaxed">{truncate(note.content)}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-indigo-50">
                <span className="text-[10px] text-indigo-400/30">{note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}</span>
                <span className="text-[10px] text-indigo-400/30">{note.word_count || 0} words</span>
              </div>
              {note.subject && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-400">{note.subject}</span>
              )}

              {expandedNote === note.id && (
                <div className="mt-4 pt-4 border-t border-indigo-50 space-y-3">
                  <div className="prose prose-sm max-w-none text-sm leading-relaxed" style={{ color: 'rgba(26,26,46,0.7)' }}>
                    {note.content}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(note); }} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-all">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-all">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-4xl mb-4">📝</p>
              <p className="text-indigo-400/40">No notes yet. Start building your knowledge library!</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowEditor(false)}>
          <div className="glass-card-strong p-8 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">{editingNote ? 'Edit Note' : 'New Note'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Title</label>
                <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="Note title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Subject</label>
                <input value={editForm.subject} onChange={e => setEditForm({...editForm, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Content</label>
                <textarea value={editForm.content} onChange={e => setEditForm({...editForm, content: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm resize-none"
                  rows={12} placeholder="Write your notes here..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
                  {editingNote ? 'Save Changes' : 'Create Note'}
                </button>
                <button onClick={() => setShowEditor(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default NotesSection;
