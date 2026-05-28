import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useHabits, useCreateHabit, useCompleteHabit } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const ICONS = ['📌', '📚', '🏃', '💻', '🎯', '🧠', '🎨', '🌱', '💪', '🧘', '📝', '🎵', '☕', '💧', '😴'];

function HabitsSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📌', frequency: 'daily', color: '#89AACC' });

  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();
  const [completing, setCompleting] = useState(null);

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
    createHabit.mutate(form);
    setShowModal(false);
    setForm({ name: '', icon: '📌', frequency: 'daily', color: '#89AACC' });
  };

  const handleComplete = async (habit) => {
    setCompleting(habit.id);
    await completeHabit.mutateAsync({ id: habit.id });
    setCompleting(null);
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Tracking</p>
            <h2 className="section-heading">Daily *habits*</h2>
            <p className="section-subtext">Build consistent routines.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-5 py-2.5">
            + New Habit
          </button>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {habits.map(habit => (
            <div key={habit.id}
              className="glass-card p-5 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="text-2xl mb-3">{habit.icon}</span>
              <h3 className="text-sm font-medium text-text-primary mb-3">{habit.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-muted mb-3">
                <span className="uppercase tracking-wider">{habit.frequency}</span>
              </div>
              <button
                onClick={() => handleComplete(habit)}
                disabled={completing === habit.id}
                className="w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-40"
                style={{ borderColor: habit.color || '#89AACC' }}
              >
                {completing === habit.id ? (
                  <span className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span style={{ color: habit.color || '#89AACC' }}>✓</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-6">Create Habit</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Habit name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              <div>
                <p className="text-xs text-muted mb-2">Choose icon</p>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(p => ({ ...p, icon }))}
                      className={`w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-all ${form.icon === icon ? 'ring-2 ring-text-primary bg-surface' : 'bg-stroke/30 hover:bg-stroke'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <select value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-full h-10 rounded-xl cursor-pointer bg-surface border border-stroke" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createHabit.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                  {createHabit.isPending ? 'Creating...' : 'Create'}
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

export default HabitsSection;
