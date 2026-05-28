import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRoadmaps, useCreateRoadmap, useCompleteTopic, useAddTopic } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function RoadmapSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ skill_name: '', description: '' });
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);

  const { data: roadmaps = [] } = useRoadmaps();
  const createRoadmap = useCreateRoadmap();
  const completeTopic = useCompleteTopic();
  const addTopic = useAddTopic();

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
    createRoadmap.mutate(form);
    setShowModal(false);
    setForm({ skill_name: '', description: '' });
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
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-5 py-2.5">
            + New Roadmap
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roadmaps.map(roadmap => (
            <div key={roadmap.id}
              className="glass-card p-6 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
              onClick={() => setSelectedRoadmap(selectedRoadmap?.id === roadmap.id ? null : roadmap)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-text-primary">{roadmap.skill_name}</h3>
                <span className="text-[10px] text-muted uppercase tracking-wider">
                  {roadmap.topics?.filter(t => t.is_completed).length || 0}/{roadmap.topics?.length || 0}
                </span>
              </div>
              {roadmap.description && (
                <p className="text-xs text-muted mb-4">{roadmap.description}</p>
              )}

              {/* Progress bar */}
              <div className="h-1.5 bg-stroke rounded-full overflow-hidden mb-4">
                <div className="h-full rounded-full accent-gradient transition-all duration-500"
                  style={{ width: `${roadmap.topics?.length ? ((roadmap.topics.filter(t => t.is_completed).length / roadmap.topics.length) * 100) : 0}%` }} />
              </div>

              {/* Topics */}
              {selectedRoadmap?.id === roadmap.id && (
                <div className="space-y-2 mt-4 pt-4 border-t border-stroke">
                  {roadmap.topics?.map(topic => (
                    <div key={topic.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-stroke/30 transition-all hover:bg-stroke/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); completeTopic.mutate({ roadmapId: roadmap.id, topicId: topic.id }); }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          topic.is_completed ? 'border-[#89AACC] bg-[#89AACC]' : 'border-stroke hover:border-[#89AACC]'
                        }`}>
                        {topic.is_completed && <span className="text-[10px] text-bg">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${topic.is_completed ? 'text-muted line-through' : 'text-text-primary'}`}>
                          {topic.topic_name}
                        </p>
                        {topic.description && (
                          <p className="text-[10px] text-muted/50 truncate">{topic.description}</p>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        topic.level === 'beginner' ? 'text-green-400 bg-green-400/10' :
                        topic.level === 'intermediate' ? 'text-yellow-400 bg-yellow-400/10' :
                        'text-red-400 bg-red-400/10'
                      }`}>
                        {topic.level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-6">Create Roadmap</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Skill name" value={form.skill_name} onChange={e => setForm(p => ({ ...p, skill_name: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <textarea rows={3} placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all resize-none" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createRoadmap.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                  {createRoadmap.isPending ? 'Creating...' : 'Create'}
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

export default RoadmapSection;
