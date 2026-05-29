import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useResources, useCreateResource, useUpdateResource, useDeleteResource } from '../../hooks/api';
import ConfirmDialog from '../../components/ConfirmDialog';

gsap.registerPlugin(ScrollTrigger);

function ResourcesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', description: '', type: 'link', subject_tag: '', category: 'General', thumbnail_url: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: resources = [] } = useResources();
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const openCreate = () => {
    setEditingResource(null);
    setForm({ title: '', url: '', description: '', type: 'link', subject_tag: '', category: 'General', thumbnail_url: '' });
    setShowModal(true);
  };

  const openEdit = (resource) => {
    setEditingResource(resource);
    setForm({
      title: resource.title || '',
      url: resource.url || '',
      description: resource.description || '',
      type: resource.type || 'link',
      subject_tag: resource.subject_tag || '',
      category: resource.category || 'General',
      thumbnail_url: resource.thumbnail_url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingResource) {
      updateResource.mutate({ id: editingResource.id, ...form });
    } else {
      createResource.mutate(form);
    }
    setShowModal(false);
    setEditingResource(null);
    setForm({ title: '', url: '', description: '', type: 'link', subject_tag: '', category: 'General', thumbnail_url: '' });
  };

  const handleDelete = (resource) => {
    setDeleteConfirm(resource);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteResource.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const typeIcons = { link: '🔗', youtube: '🎥', pdf: '📄', note: '📝', tool: '🛠️' };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Library</p>
            <h2 className="section-heading">Study *resources*</h2>
            <p className="section-subtext">Curated learning materials.</p>
          </div>
          <button onClick={openCreate} className="btn-primary text-xs px-5 py-2.5">
            + Add Resource
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(resource => (
            <div key={resource.id}
              className="glass-card p-5 transition-all duration-300 hover:scale-[1.02] group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-lg">{typeIcons[resource.type] || '🔗'}</span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(resource); }}
                    className="text-muted hover:text-text-primary transition-all text-xs p-1">✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(resource); }}
                    className="text-muted hover:text-red-400 transition-all text-xs p-1">🗑️</button>
                </div>
              </div>
              <h3 className="text-sm font-medium text-text-primary mb-1">{resource.title}</h3>
              {resource.description && (
                <p className="text-xs text-muted mb-3 line-clamp-2">{resource.description}</p>
              )}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-stroke/50 text-muted">{resource.category || 'General'}</span>
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noreferrer"
                    className="text-[10px] text-[#89AACC] hover:text-[#4E85BF] transition-colors">
                    Open ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditingResource(null); }}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-6">
              {editingResource ? 'Edit Resource' : 'Add Resource'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <input type="text" placeholder="URL" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <textarea rows={2} placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                  <option value="link">Link</option>
                  <option value="youtube">YouTube</option>
                  <option value="pdf">PDF</option>
                  <option value="note">Note</option>
                  <option value="tool">Tool</option>
                </select>
                <input type="text" placeholder="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              </div>
              <input type="text" placeholder="Subject tag" value={form.subject_tag} onChange={e => setForm(p => ({ ...p, subject_tag: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <input type="text" placeholder="Thumbnail URL (optional)" value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createResource.isPending || updateResource.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                  {(createResource.isPending || updateResource.isPending) ? 'Saving...' : (editingResource ? 'Update' : 'Add')}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setEditingResource(null); }}
                  className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </section>
  );
}

export default ResourcesSection;
