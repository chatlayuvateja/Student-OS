import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useUploadNoteFile, useResources, useProfile } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function NotesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', subject: 'General', color: '#89AACC', tags_array: [], resource_links: [] });
  const [showCreate, setShowCreate] = useState(false);

  // File upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', subject: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const fileUploadRef = useRef(null);

  // Attach resource states
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [attachedResources, setAttachedResources] = useState([]);

  const { data: notes = [] } = useNotes();
  const { data: profile } = useProfile();
  const { data: allResources = [] } = useResources();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const uploadNoteFile = useUploadNoteFile();

  const subjectOptions = React.useMemo(() => {
    if (!profile?.subjects || !Array.isArray(profile.subjects)) return [];
    return profile.subjects.map(s => typeof s === 'string' ? { name: s, color: '#89AACC' } : s);
  }, [profile]);

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
    setForm({ title: '', content: '', subject: 'General', color: '#89AACC', tags_array: [], resource_links: [] });
    setAttachedResources([]);
    setShowCreate(true);
  };

  const handleEdit = (note) => {
    setEditNote(note);
    setForm({
      title: note.title || '',
      content: note.content || '',
      subject: note.subject || 'General',
      color: note.color || '#89AACC',
      tags_array: note.tags_array || [],
      resource_links: note.resource_links || [],
    });
    setAttachedResources(note.resource_links || []);
    setShowCreate(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = { ...form, resource_links: attachedResources };
    if (editNote) {
      updateNote.mutate({ id: editNote.id, ...payload });
    } else {
      createNote.mutate(payload);
    }
    setShowCreate(false);
  };

  const handledDelete = (note) => {
    if (confirm('Delete this note?')) deleteNote.mutate(note.id);
  };

  const toggleResource = (resource) => {
    setAttachedResources(prev => {
      const exists = prev.find(r => r.id === resource.id);
      if (exists) return prev.filter(r => r.id !== resource.id);
      return [...prev, { id: resource.id, title: resource.title, url: resource.url, type: resource.type }];
    });
  };

  const typeIcons = { link: '🔗', youtube: '🎥', pdf: '📄', note: '📝', tool: '🛠️' };

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
              {/* Attached resources */}
              {note.resource_links?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {note.resource_links.map((r, i) => (
                    <a key={i} href={r.url} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[9px] px-1.5 py-0.5 rounded-md bg-stroke/50 text-muted hover:text-[#89AACC] transition-all flex items-center gap-1">
                      {typeIcons[r.type] || '🔗'} {r.title?.slice(0, 15)}
                    </a>
                  ))}
                </div>
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
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">Subject</label>
                {subjectOptions.length > 0 ? (
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                    <option value="General">General</option>
                    {subjectOptions.map((s, i) => (
                      <option key={i} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" placeholder="Subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                )}
              </div>
              <textarea rows={5} placeholder="Write your notes here..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all resize-none" />

              {/* Attach Resources */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted">Attached Resources</span>
                  <button type="button" onClick={() => setShowResourcePicker(true)}
                    className="text-[10px] text-[#89AACC] hover:text-[#4E85BF] transition-all">
                    + Attach Resource
                  </button>
                </div>
                {attachedResources.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {attachedResources.map((r, i) => (
                      <span key={i}
                        className="text-[10px] px-2 py-1 rounded-lg bg-stroke/50 text-text-primary flex items-center gap-1.5">
                        {typeIcons[r.type] || '🔗'} {r.title?.slice(0, 18)}
                        <button type="button" onClick={() => toggleResource(r)}
                          className="text-muted hover:text-red-400 ml-0.5">✕</button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted/50 italic">No resources attached yet.</p>
                )}
              </div>

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

      {/* Resource Picker Modal */}
      {showResourcePicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowResourcePicker(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-1">Attach Resource</h3>
            <p className="text-xs text-muted mb-5">Select resources to link to this note.</p>

            {allResources.length === 0 ? (
              <p className="text-sm text-muted italic text-center py-6">No resources available. Add some in the Resources section first.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {allResources.map(resource => {
                  const isAttached = attachedResources.some(r => r.id === resource.id);
                  return (
                    <div key={resource.id}
                      onClick={() => toggleResource(resource)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all border ${
                        isAttached ? 'border-[#89AACC]/40 bg-[#89AACC]/5' : 'border-transparent bg-surface hover:bg-stroke/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isAttached ? 'border-[#89AACC] bg-[#89AACC]' : 'border-stroke'
                      }`}>
                        {isAttached && <span className="text-[8px] text-bg">✓</span>}
                      </div>
                      <span className="text-xs">{typeIcons[resource.type] || '🔗'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-primary truncate">{resource.title}</p>
                        {resource.subject_tag && <p className="text-[9px] text-muted">{resource.subject_tag}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={() => setShowResourcePicker(false)}
              className="w-full py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90">
              Done
            </button>
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
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">Subject</label>
                {subjectOptions.length > 0 ? (
                  <select value={uploadForm.subject} onChange={e => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                    <option value="">General</option>
                    {subjectOptions.map((s, i) => (
                      <option key={i} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" placeholder="Subject" value={uploadForm.subject}
                    onChange={e => setUploadForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                )}
              </div>
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
