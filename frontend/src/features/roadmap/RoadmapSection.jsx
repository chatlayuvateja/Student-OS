import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRoadmaps, useCreateRoadmap, useAddTopic, useCompleteTopic } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function RoadmapSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const roadmapsRef = useRef(null);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ skill_name: '', description: '' });
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [topicForm, setTopicForm] = useState({ topic_name: '', description: '', level: 'beginner' });

  const { data: roadmaps = [] } = useRoadmaps();
  const createRoadmap = useCreateRoadmap();
  const addTopic = useAddTopic();
  const completeTopic = useCompleteTopic();

  const currentRoadmap = activeRoadmap
    ? roadmaps.find(r => r.id === activeRoadmap)
    : roadmaps[0];

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (roadmapsRef.current && currentRoadmap) {
      const nodes = roadmapsRef.current.querySelectorAll('.roadmap-node');
      const lines = roadmapsRef.current.querySelectorAll('.roadmap-line');
      
      const ctx = gsap.context(() => {
        // Animate connection lines first
        gsap.fromTo(lines, { strokeDashoffset: 500, strokeDasharray: 500 }, {
          strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut',
          scrollTrigger: { trigger: roadmapsRef.current, start: 'top 80%' },
        });
        // Then pop in nodes
        gsap.fromTo(nodes, { scale: 0, opacity: 0 }, {
          scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: roadmapsRef.current, start: 'top 80%' },
        });
      });
      return () => ctx.revert();
    }
  }, [currentRoadmap]);

  const handleCreateRoadmap = (e) => {
    e.preventDefault();
    createRoadmap.mutate(form);
    setForm({ skill_name: '', description: '' });
    setShowAdd(false);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (currentRoadmap) {
      addTopic.mutate({ roadmapId: currentRoadmap.id, ...topicForm, order_index: (currentRoadmap.topics || []).length });
    }
    setTopicForm({ topic_name: '', description: '', level: 'beginner' });
    setShowAddTopic(false);
  };

  const handleComplete = (topicId) => {
    if (currentRoadmap) {
      completeTopic.mutate({ roadmapId: currentRoadmap.id, topicId });
    }
  };

  const topics = currentRoadmap?.topics?.sort((a, b) => a.order_index - b.order_index) || [];
  const completedCount = topics.filter(t => t.is_completed).length;
  const progress = topics.length > 0 ? (completedCount / topics.length) * 100 : 0;

  const getNodeColor = (topic) => {
    if (topic.is_completed) return '#00C2A8';
    if (topic.level === 'beginner') return '#6366f1';
    if (topic.level === 'intermediate') return '#F5A623';
    return '#FF6B6B';
  };

  const getNodeStatus = (topic) => {
    if (topic.is_completed) return '✅';
    if (topic.level === 'beginner') return '🟢';
    if (topic.level === 'intermediate') return '🟡';
    return '🔴';
  };

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 bg-gradient-to-b from-cream via-soft-mint/10 to-cream">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">The Road to<br />Mastery</h2>
          <p className="section-subtitle mt-4">Every expert was once a beginner.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-2xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
              + New Roadmap
            </button>
            {currentRoadmap && (
              <button onClick={() => setShowAddTopic(true)} className="px-6 py-3 rounded-2xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00C2A8, #14B8A6)' }}>
                + Add Topic
              </button>
            )}
          </div>
          {/* Roadmap tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {roadmaps.map(rm => (
              <button key={rm.id} onClick={() => setActiveRoadmap(rm.id)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  (activeRoadmap === rm.id || (!activeRoadmap && roadmaps[0]?.id === rm.id))
                    ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'bg-white text-indigo-400 border border-indigo-50'
                }`}
              >
                {rm.skill_name}
              </button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        {currentRoadmap && (
          <div className="mb-8 glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{currentRoadmap.skill_name}</h4>
              <p className="text-xs text-indigo-400/40">{completedCount} of {topics.length} topics completed</p>
            </div>
            <div className="w-full h-2 rounded-full bg-indigo-50 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00C2A8, #14B8A6)' }} />
            </div>
            <p className="text-right text-xs font-mono font-bold text-mint mt-1">{progress.toFixed(0)}%</p>
          </div>
        )}

        {/* Roadmap nodes */}
        <div ref={roadmapsRef} className="relative">
          {currentRoadmap && topics.map((topic, i) => (
            <div key={topic.id} className="roadmap-node flex items-start gap-4 mb-4 last:mb-0">
              {/* Connection line */}
              {i < topics.length - 1 && (
                <svg className="roadmap-line absolute left-[15px]" style={{ top: `${i * 60 + 40}px` }} width="2" height="60" viewBox="0 0 2 60">
                  <line x1="1" y1="0" x2="1" y2="60" stroke="rgba(59,31,168,0.15)" strokeWidth="2" />
                </svg>
              )}
              {/* Node dot */}
              <div className="relative flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 cursor-pointer hover:scale-110"
                  style={{ background: getNodeColor(topic), color: 'white' }}
                  onClick={() => !topic.is_completed && handleComplete(topic.id)}
                >
                  {topic.is_completed ? '✓' : getNodeStatus(topic)}
                </div>
                {topic.is_completed && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-mint animate-ping opacity-50" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 glass-card p-4 hover-lift" style={{ opacity: topic.is_completed ? 0.7 : 1 }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>{topic.topic_name}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    topic.level === 'beginner' ? 'bg-blue-50 text-blue-500' :
                    topic.level === 'intermediate' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {topic.level}
                  </span>
                </div>
                {topic.description && <p className="text-xs text-indigo-400/60 mt-1">{topic.description}</p>}
              </div>
            </div>
          ))}
          {currentRoadmap && topics.length === 0 && (
            <div className="text-center py-12 text-indigo-400/40">
              <p>No topics yet. Add your first topic!</p>
            </div>
          )}
          {!currentRoadmap && (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🗺️</p>
              <p className="text-indigo-400/40">Create a roadmap to start tracking your learning journey.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Roadmap Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">New Roadmap</h3>
            <form onSubmit={handleCreateRoadmap} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Skill Name</label>
                <input value={form.skill_name} onChange={e => setForm({...form, skill_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="e.g. Machine Learning" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm resize-none" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>Create</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAddTopic(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">Add Topic</h3>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Topic Name</label>
                <input value={topicForm.topic_name} onChange={e => setTopicForm({...topicForm, topic_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="e.g. Linear Regression" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Description</label>
                <textarea value={topicForm.description} onChange={e => setTopicForm({...topicForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm resize-none" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Level</label>
                <select value={topicForm.level} onChange={e => setTopicForm({...topicForm, level: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm">
                  <option value="beginner">Beginner 🟢</option>
                  <option value="intermediate">Intermediate 🟡</option>
                  <option value="advanced">Advanced 🔴</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00C2A8, #14B8A6)' }}>Add Topic</button>
                <button type="button" onClick={() => setShowAddTopic(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default RoadmapSection;
