import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useUploadNoteFile } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function NotesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', subject: 'General', color: '#89AACC', tags_array: [] });
  const [showCreate, setShowCreate] = useState(false);

  // File upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', subject: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const fileUploadRef = useRef(null);

  const { data: notes = [] } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const uploadNoteFile = useUploadNoteFile();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleCreate = () => {
    setEditNote(null);
    setForm({ title: '', content: '', subject: 'General', color: '#89AACC', tags_array: [] });
    setShowCreate(true);
  };

  const handleEdit = (note) => {
    setEditNote(note);
    setForm({ title: note.title || '', content: note.content || '', subject: note.subject || 'General', color: note.color || '#89AACC', tags_array: note.tags_array || [] });
    setShowCreate(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editNote) {
      updateNote.mutate({ id: editNote.id, ...form });
    } else {
      createNote.mutate(form);
    }
    setShowCreate(false);
  };

  const handledDelete = (note) => {
    if (confirm('Delete this note?')) deleteNote.mutate(note.id);
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Notes</p>
            <h2 className="section-heading">Class *notes*</h2>
            <p className="section-subtext">Capture and organize your learning.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} className="btn-primary text-xs px-5 py-2.5">
              ✏️ Type Note
            </button>
            <button onClick={() => setShowUploadModal(true)}
              className="rounded-xl text-xs px-4 py-2.5 font-medium transition-all"
              style={{ background: 'rgba(78, 133, 191, 0.12)', color: '#89AACC', border: '1px solid rgba(78, 133, 191, 0.3)' }}>
              📎 Upload
            </button>
          </div>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note.id}
              className="glass-card p-5 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              onClick={() => handleEdit(note)}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-muted">{note.subject || 'General'}</span>
                <button onClick={(e) => { e.stopPropagation(); handledDelete(note); }}
                  className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
              </div>
              <h3 className="text-base font-medium text-text-primary mb-2 line-clamp-2">{note.title}</h3>
              <p className="text-xs text-muted line-clamp-3">{note.content}</p>
              {note.note_type === 'file' && (
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase"
                    style={{
                      background: note.file_type === 'PDF' ? 'rgba(255,107,107,0.12)' : note.file_type === 'DOCX' || note.file_type === 'DOC' ? 'rgba(137,170,204,0.12)' : 'rgba(245,166,35,0.12)',
                      color: note.file_type === 'PDF' ? '#FF6B6B' : note.file_type === 'DOCX' || note.file_type === 'DOC' ? '#89AACC' : '#F5A623',
                    }}>
                    {note.file_type}
                  </span>
                  <a href={`http://localhost:3001${note.file_url}`} target="_blank" rel="noreferrer"
                    className="text-xs font-medium text-[#89AACC] hover:text-[#4E85BF] transition-colors"
                    onClick={e => e.stopPropagation()}>
                    Open ↗
                  </a>
                </div>
              )}
              {note.note_type === 'file' && (
                <p className="text-[11px] text-muted/50 mt-1 truncate">{note.file_original_name}</p>
              )}
              {note.tags_array?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {note.tags_array.map((tag, i) => (
                    <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md bg-stroke/50 text-muted">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass-card-strong p-8 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-6">
              {editNote ? 'Edit Note' : 'New Note'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <input type="text" placeholder="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <textarea rows={5} placeholder="Write your notes here..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createNote.isPending || updateNote.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                  {editNote ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-1">Upload Study File</h3>
            <p className="text-xs text-muted mb-6">PDF, PPT, PPTX, DOC, DOCX · Max 50MB</p>

            <div className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-[#89AACC] hover:bg-surface/30 mb-5"
              style={{ borderColor: uploadFile ? '#89AACC' : 'hsl(var(--stroke))' }}
              onClick={() => fileUploadRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) { setUploadFile(f); setUploadForm(prev => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') })); }
              }}>
              {uploadFile ? (
                <>
                  <p className="text-2xl mb-1">📄</p>
                  <p className="text-sm font-medium text-text-primary">{uploadFile.name}</p>
                  <p className="text-[11px] text-muted mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-3xl mb-2">📎</p>
                  <p className="text-sm text-muted">Click or drag file here</p>
                  <p className="text-[11px] text-muted/50 mt-1">PDF, PPT, PPTX, DOC, DOCX</p>
                </>
              )}
            </div>

            <input ref={fileUploadRef} type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setUploadFile(f); setUploadForm(prev => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') })); }
              }} />

            <div className="space-y-3 mb-6">
              <input type="text" placeholder="Note title" value={uploadForm.title}
                onChange={e => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <input type="text" placeholder="Subject" value={uploadForm.subject}
                onChange={e => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
            </div>

            <div className="flex gap-3">
              <button disabled={!uploadFile || uploadNoteFile.isPending}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40"
                onClick={() => {
                  if (!uploadFile) return;
                  uploadNoteFile.mutate({ file: uploadFile, title: uploadForm.title, subject: uploadForm.subject });
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadForm({ title: '', subject: '' });
                }}>
                {uploadNoteFile.isPending ? 'Uploading...' : 'Upload File'}
              </button>
              <button type="button" onClick={() => { setShowUploadModal(false); setUploadFile(null); }}
                className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default NotesSection;
