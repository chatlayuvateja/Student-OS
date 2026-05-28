import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useResources, useCreateResource, useDeleteResource } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function ResourcesSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', url: '', type: 'link', subject_tag: '', category: '' });

  const { data, isLoading } = useResources();
  const resources = data?.resources || [];
  const categories = data?.categories || [];
  const createResource = useCreateResource();
  const deleteResource = useDeleteResource();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (gridRef.current && resources.length > 0) {
      gsap.fromTo(gridRef.current.querySelectorAll('.resource-card'), { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: gridRef.current, start: 'top 85%' },
      });
    }
  }, [resources]);

  const filtered = filter === 'all' ? resources : resources.filter(r => r.type === filter || r.subject_tag === filter);

  const handleAdd = (e) => {
    e.preventDefault();
    createResource.mutate(form);
    setForm({ title: '', description: '', url: '', type: 'link', subject_tag: '', category: '' });
    setShowAdd(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'youtube': return '🎬';
      case 'pdf': return '📄';
      case 'tool': return '🔧';
      default: return '🔗';
    }
  };

  // Resource of the day
  const resourceOfDay = resources.length > 0
    ? resources[new Date().getDate() % resources.length]
    : null;

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 bg-gradient-to-b from-cream via-soft-peach/20 to-cream">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Your Personal<br />Learning Arsenal</h2>
          <p className="section-subtitle mt-4">Everything you need, all in one place.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-2xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
              + Add Resource
            </button>
          </div>
          {/* Filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {['all', 'link', 'youtube', 'pdf', 'tool'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                  filter === f ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-400 border border-indigo-50'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Resource of the Day */}
        {resourceOfDay && (
          <div className="mb-8 glass-card p-5 border-gold/20" style={{ borderWidth: '1px', borderStyle: 'solid' }}>
            <div className="flex items-center gap-3">
              <span className="text-lg">⭐</span>
              <div>
                <p className="text-[10px] font-medium text-gold uppercase tracking-wider">Resource of the Day</p>
                <p className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{resourceOfDay.title}</p>
              </div>
              <a href={resourceOfDay.url} target="_blank" rel="noopener noreferrer" className="ml-auto px-4 py-2 rounded-xl text-xs font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #F5A623, #FF6B6B)' }}>
                Open
              </a>
            </div>
          </div>
        )}

        {/* Masonry grid */}
        <div ref={gridRef} className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map(resource => (
            <div key={resource.id} className="resource-card glass-card p-5 break-inside-avoid hover-lift group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl">{getTypeIcon(resource.type)}</span>
                <button onClick={() => deleteResource.mutate(resource.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-red-400/80 text-white text-[10px] flex items-center justify-center transition-opacity">
                  ×
                </button>
              </div>
              <h4 className="text-sm font-semibold mb-1" style={{ color: '#1a1a2e' }}>{resource.title}</h4>
              {resource.description && <p className="text-xs text-indigo-400/60 mb-3 line-clamp-2">{resource.description}</p>}
              {resource.subject_tag && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-400 mb-3">{resource.subject_tag}</span>
              )}
              <a href={resource.url} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center py-2 rounded-xl text-xs font-medium text-white transition-all hover:shadow-md"
                style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
                Open
              </a>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-4xl mb-4">📦</p>
              <p className="text-indigo-400/40">No resources yet. Save your first learning resource!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">Add Resource</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">URL</label>
                  <input value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="Resource title" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 outline-none text-sm">
                    <option value="link">Link</option>
                    <option value="youtube">YouTube</option>
                    <option value="pdf">PDF</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Subject</label>
                  <input value={form.subject_tag} onChange={e => setForm({...form, subject_tag: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 outline-none text-sm" placeholder="Subject" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>Save Resource</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default ResourcesSection;
