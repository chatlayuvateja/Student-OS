import React, { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  useRoadmaps, useCreateRoadmap, useUpdateRoadmap, useDeleteRoadmap,
  useCompleteTopic, useAddTopic, useDeleteTopic,
  useTopicResources, useAddTopicResource, useUpdateTopicResource, useDeleteTopicResource,
} from '../../hooks/api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

gsap.registerPlugin(ScrollTrigger);

const EMPTY_CREATE_FORM = { skill_name: '', description: '', topics: [] };
const EMPTY_RESOURCE_FORM = { title: '', url: '', type: 'link', description: '' };
const EMPTY_TOPIC_ENTRY = { topic_name: '', level: 'beginner', description: '' };

const TYPE_ICONS = { link: '🔗', youtube: '🎥', pdf: '📄', note: '📝', tool: '🛠️' };

function RoadmapSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  // Create / Edit modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingRoadmap, setEditingRoadmap] = useState(null);
  const [createForm, setCreateForm] = useState({ ...EMPTY_CREATE_FORM });

  // Topic detail modal
  const [topicDetail, setTopicDetail] = useState(null);

  // Resource editing in topic detail
  const [resourceForm, setResourceForm] = useState({ ...EMPTY_RESOURCE_FORM });
  const [editingResource, setEditingResource] = useState(null);

  // Delete confirmations
  const [deleteRoadmapTarget, setDeleteRoadmapTarget] = useState(null);
  const [deleteResourceTarget, setDeleteResourceTarget] = useState(null);

  const { data: roadmaps = [] } = useRoadmaps();
  const createRoadmap = useCreateRoadmap();
  const updateRoadmap = useUpdateRoadmap();
  const deleteRoadmap = useDeleteRoadmap();
  const completeTopic = useCompleteTopic();
  const addTopic = useAddTopic();
  const addTopicResource = useAddTopicResource();
  const updateTopicResource = useUpdateTopicResource();
  const deleteTopicResource = useDeleteTopicResource();

  const deleteTopic = useDeleteTopic();

  const { data: topicResources = [] } = useTopicResources(topicDetail?.topicId);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // --- Create / Edit Roadmap ---

  const openCreateModal = () => {
    setEditingRoadmap(null);
    setCreateForm({ ...EMPTY_CREATE_FORM });
    setCreateModalOpen(true);
  };

  const openEditModal = (e, roadmap) => {
    e.stopPropagation();
    setEditingRoadmap(roadmap);
    setCreateForm({
      skill_name: roadmap.skill_name,
      description: roadmap.description || '',
      topics: roadmap.topics?.map(t => ({
        topic_name: t.topic_name,
        level: t.level || 'beginner',
        description: t.description || '',
      })) || [],
    });
    setCreateModalOpen(true);
  };

  const addTopicEntry = () => {
    setCreateForm(p => ({ ...p, topics: [...p.topics, { ...EMPTY_TOPIC_ENTRY }] }));
  };

  const removeTopicEntry = (index) => {
    setCreateForm(p => ({ ...p, topics: p.topics.filter((_, i) => i !== index) }));
  };

  const updateTopicEntry = (index, field, value) => {
    setCreateForm(p => {
      const topics = [...p.topics];
      topics[index] = { ...topics[index], [field]: value };
      return { ...p, topics };
    });
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (editingRoadmap) {
      updateRoadmap.mutate(
        { id: editingRoadmap.id, skill_name: createForm.skill_name, description: createForm.description },
        { onSuccess: () => { setCreateModalOpen(false); setEditingRoadmap(null); } }
      );
    } else {
      createRoadmap.mutate(
        { skill_name: createForm.skill_name, description: createForm.description },
        {
          onSuccess: (roadmap) => {
            // Create topics sequentially after roadmap is created
            const topics = createForm.topics;
            if (topics.length > 0) {
              let idx = 0;
              const createNextTopic = () => {
                if (idx >= topics.length) {
                  setCreateModalOpen(false);
                  setCreateForm({ ...EMPTY_CREATE_FORM });
                  return;
                }
                const t = topics[idx];
                addTopic.mutate(
                  { roadmapId: roadmap.id, topic_name: t.topic_name, level: t.level, description: t.description },
                  { onSuccess: () => { idx++; createNextTopic(); } }
                );
              };
              createNextTopic();
            } else {
              setCreateModalOpen(false);
              setCreateForm({ ...EMPTY_CREATE_FORM });
            }
          },
        }
      );
    }
  };

  // --- Cascade delete topics & resources ---

  const handleDeleteRoadmap = (roadmap) => {
    const topics = roadmap.topics || [];
    if (topics.length === 0) {
      deleteRoadmap.mutate(roadmap.id, { onSuccess: () => setDeleteRoadmapTarget(null) });
      return;
    }
    let idx = 0;
    const deleteNextTopic = () => {
      if (idx >= topics.length) {
        deleteRoadmap.mutate(roadmap.id, { onSuccess: () => setDeleteRoadmapTarget(null) });
        return;
      }
      deleteTopic.mutate(topics[idx].id, {
        onSuccess: () => { idx++; deleteNextTopic(); }
      });
    };
    deleteNextTopic();
  };

  // --- Topic Detail Modal ---

  const openTopicDetail = (e, roadmap, topic) => {
    e.stopPropagation();
    setTopicDetail({ roadmapId: roadmap.id, topicId: topic.id, topic, roadmap });
    setResourceForm({ ...EMPTY_RESOURCE_FORM });
    setEditingResource(null);
  };

  const handleToggleComplete = () => {
    if (!topicDetail) return;
    if (!topicDetail.topic.is_completed) {
      completeTopic.mutate({ roadmapId: topicDetail.roadmapId, topicId: topicDetail.topicId });
    }
  };

  // --- Resource CRUD in Topic Detail ---

  const handleAddResource = (e) => {
    e.preventDefault();
    if (!topicDetail) return;
    if (editingResource) {
      updateTopicResource.mutate(
        { topicId: topicDetail.topicId, resourceId: editingResource.id, ...resourceForm },
        { onSuccess: () => { setResourceForm({ ...EMPTY_RESOURCE_FORM }); setEditingResource(null); } }
      );
    } else {
      addTopicResource.mutate(
        { topicId: topicDetail.topicId, ...resourceForm },
        { onSuccess: () => setResourceForm({ ...EMPTY_RESOURCE_FORM }) }
      );
    }
  };

  const startEditResource = (r) => {
    setEditingResource(r);
    setResourceForm({ title: r.title, url: r.url || '', type: r.type || 'link', description: r.description || '' });
  };

  const cancelEditResource = () => {
    setEditingResource(null);
    setResourceForm({ ...EMPTY_RESOURCE_FORM });
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Learning</p>
            <h2 className="section-heading">Skill *roadmaps*</h2>
            <p className="section-subtext">Track your learning journey.</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary text-xs px-5 py-2.5">
            + Create Roadmap
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmaps.map(roadmap => {
            const completedCount = roadmap.topics?.filter(t => t.is_completed).length || 0;
            const totalCount = roadmap.topics?.length || 0;
            const progressPct = totalCount ? (completedCount / totalCount) * 100 : 0;
            return (
              <div key={roadmap.id}
                className="glass-card p-6 transition-all duration-300 hover:scale-[1.01] group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-text-primary">{roadmap.skill_name}</h3>
                    {roadmap.description && (
                      <p className="text-xs text-muted mt-0.5">{roadmap.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                    <span className="text-[10px] text-muted uppercase tracking-wider">
                      {completedCount}/{totalCount}
                    </span>
                    <button
                      onClick={(e) => openEditModal(e, roadmap)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-[#89AACC] transition-all text-xs p-1"
                      title="Edit roadmap"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteRoadmapTarget(roadmap); }}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all text-xs p-1"
                      title="Delete roadmap"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-stroke rounded-full overflow-hidden mb-4">
                  <div className="h-full rounded-full accent-gradient transition-all duration-500"
                    style={{ width: `${progressPct}%` }} />
                </div>

                {/* Topics as clickable cards */}
                <div className="space-y-2">
                  {roadmap.topics?.map(topic => (
                    <div key={topic.id}
                      onClick={(e) => openTopicDetail(e, roadmap, topic)}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group/topic ${
                        topic.is_completed ? 'bg-stroke/20' : 'bg-stroke/30 hover:bg-stroke/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        topic.is_completed ? 'border-[#89AACC] bg-[#89AACC]' : 'border-stroke'
                      }`}>
                        {topic.is_completed && <span className="text-[10px] text-bg">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${topic.is_completed ? 'text-muted line-through' : 'text-text-primary'}`}>
                          {topic.topic_name}
                        </p>
                        {topic.description && (
                          <p className="text-[10px] text-muted/60 truncate">{topic.description}</p>
                        )}
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        topic.level === 'beginner' ? 'text-green-400 bg-green-400/10' :
                        topic.level === 'intermediate' ? 'text-yellow-400 bg-yellow-400/10' :
                        'text-red-400 bg-red-400/10'
                      }`}>
                        {topic.level}
                      </span>
                      <span className="text-[9px] text-muted/40 opacity-0 group-hover/topic:opacity-100 transition-all">
                        view →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Roadmap Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingRoadmap(null); }}
        title={editingRoadmap ? 'Edit Roadmap' : 'Create Roadmap'}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <input type="text" placeholder="Skill name" value={createForm.skill_name}
            onChange={e => setCreateForm(p => ({ ...p, skill_name: e.target.value }))} required
            className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
          <textarea rows={2} placeholder="Description (optional)" value={createForm.description}
            onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all resize-none" />

          {/* Dynamic topic list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted uppercase tracking-wider">Topics</span>
              <button type="button" onClick={addTopicEntry}
                className="text-[10px] text-[#89AACC] hover:text-[#4E85BF] transition-all font-medium">
                + Add topic
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {createForm.topics.map((topic, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-surface border border-stroke">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input type="text" placeholder="Topic name" value={topic.topic_name}
                      onChange={e => updateTopicEntry(i, 'topic_name', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs bg-bg border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                    <div className="flex gap-1.5">
                      <select value={topic.level}
                        onChange={e => updateTopicEntry(i, 'level', e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-lg text-[10px] bg-bg border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <button type="button" onClick={() => removeTopicEntry(i)}
                        className="px-2 py-2 rounded-lg text-[10px] text-muted hover:text-red-400 border border-stroke hover:border-red-400/30 transition-all">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createRoadmap.isPending || updateRoadmap.isPending}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
              {createRoadmap.isPending || updateRoadmap.isPending ? 'Saving...' : editingRoadmap ? 'Update Roadmap' : 'Create Roadmap'}
            </button>
            <button type="button" onClick={() => { setCreateModalOpen(false); setEditingRoadmap(null); }}
              className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Topic Detail Modal */}
      <Modal
        isOpen={!!topicDetail}
        onClose={() => { setTopicDetail(null); setEditingResource(null); setResourceForm({ ...EMPTY_RESOURCE_FORM }); }}
        title={topicDetail?.topic?.topic_name || ''}
        wide
      >
        {topicDetail && (
          <div className="space-y-6">
            {/* Topic Info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-stroke">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    topicDetail.topic.level === 'beginner' ? 'text-green-400 bg-green-400/10' :
                    topicDetail.topic.level === 'intermediate' ? 'text-yellow-400 bg-yellow-400/10' :
                    'text-red-400 bg-red-400/10'
                  }`}>
                    {topicDetail.topic.level}
                  </span>
                  <span className="text-[10px] text-muted">
                    in <span className="text-text-primary">{topicDetail.roadmap.skill_name}</span>
                  </span>
                </div>
                {topicDetail.topic.description && (
                  <p className="text-xs text-muted">{topicDetail.topic.description}</p>
                )}
              </div>
              <button
                onClick={handleToggleComplete}
                disabled={topicDetail.topic.is_completed}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  topicDetail.topic.is_completed
                    ? 'bg-[#89AACC]/15 text-[#89AACC] cursor-default'
                    : 'bg-surface border border-stroke text-muted hover:text-text-primary hover:border-text-primary/30'
                }`}
              >
                {topicDetail.topic.is_completed ? (
                  <>✅ Completed</>
                ) : (
                  <>◯ Mark as completed</>
                )}
              </button>
            </div>

            {/* Resources Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-text-primary">
                  Resources {topicResources.length > 0 && <span className="text-muted">({topicResources.length})</span>}
                </h4>
              </div>

              {/* Add / Edit Resource Form */}
              <form onSubmit={handleAddResource} className="p-4 rounded-xl bg-surface border border-stroke mb-3 space-y-2.5">
                {editingResource && (
                  <p className="text-[10px] text-[#89AACC] font-medium mb-1">Editing: {editingResource.title}</p>
                )}
                <input type="text" placeholder="Resource title" value={resourceForm.title}
                  onChange={e => setResourceForm(p => ({ ...p, title: e.target.value }))} required
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-bg border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                <input type="text" placeholder="URL (optional)" value={resourceForm.url}
                  onChange={e => setResourceForm(p => ({ ...p, url: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-bg border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                <div className="grid grid-cols-2 gap-2.5">
                  <select value={resourceForm.type}
                    onChange={e => setResourceForm(p => ({ ...p, type: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-lg text-xs bg-bg border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                    <option value="link">🔗 Link</option>
                    <option value="youtube">🎥 YouTube</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="note">📝 Note</option>
                    <option value="tool">🛠️ Tool</option>
                  </select>
                  <input type="text" placeholder="Description" value={resourceForm.description}
                    onChange={e => setResourceForm(p => ({ ...p, description: e.target.value }))}
                    className="px-3.5 py-2.5 rounded-lg text-xs bg-bg border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={addTopicResource.isPending || updateTopicResource.isPending}
                    className="flex-1 py-2.5 rounded-lg text-xs font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                    {addTopicResource.isPending || updateTopicResource.isPending ? 'Saving...' : editingResource ? 'Update Resource' : 'Add Resource'}
                  </button>
                  {editingResource && (
                    <button type="button" onClick={cancelEditResource}
                      className="px-4 py-2.5 rounded-lg text-xs text-muted border border-stroke hover:text-text-primary transition-all">
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Resource List */}
              {topicResources.length > 0 ? (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {topicResources.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-stroke group/resource">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-sm">{TYPE_ICONS[r.type] || '🔗'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-text-primary truncate">{r.title}</p>
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-stroke/50 text-muted uppercase tracking-wider">{r.type}</span>
                          </div>
                          {r.url && (
                            <a href={r.url} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-[#89AACC] hover:text-[#4E85BF] transition-all truncate block"
                              onClick={e => e.stopPropagation()}>
                              {r.url}
                            </a>
                          )}
                          {r.description && <p className="text-[10px] text-muted/60 mt-0.5">{r.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button onClick={() => startEditResource(r)}
                          className="opacity-0 group-hover/resource:opacity-100 text-muted hover:text-[#89AACC] transition-all text-xs p-1"
                          title="Edit resource">
                          ✏️
                        </button>
                        <button onClick={() => setDeleteResourceTarget(r)}
                          className="opacity-0 group-hover/resource:opacity-100 text-muted hover:text-red-400 transition-all text-xs p-1"
                          title="Delete resource">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-surface/50 border border-dashed border-stroke text-center">
                  <p className="text-xs text-muted">No resources attached yet. Add one above.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Roadmap Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteRoadmapTarget}
        onClose={() => setDeleteRoadmapTarget(null)}
        onConfirm={() => { if (deleteRoadmapTarget) handleDeleteRoadmap(deleteRoadmapTarget); }}
        title="Delete Roadmap"
        message={`Are you sure you want to delete "${deleteRoadmapTarget?.skill_name || ''}"? This will also remove all its topics and resources.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Delete Resource Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteResourceTarget}
        onClose={() => setDeleteResourceTarget(null)}
        onConfirm={() => {
          if (deleteResourceTarget && topicDetail) {
            deleteTopicResource.mutate({ topicId: topicDetail.topicId, resourceId: deleteResourceTarget.id });
          }
        }}
        title="Delete Resource"
        message={`Remove "${deleteResourceTarget?.title || ''}" from this topic?`}
        confirmText="Delete"
        variant="danger"
      />
    </section>
  );
}

export default RoadmapSection;
