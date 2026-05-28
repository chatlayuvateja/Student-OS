import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RadialBarChart, RadialBar, ResponsiveContainer, Legend } from 'recharts';
import { useHabits, useCreateHabit, useCompleteHabit } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function HabitsSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📚', frequency: 'daily', color: '#6366f1' });
  const [animatingId, setAnimatingId] = useState(null);

  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll('.habit-card');
        gsap.fromTo(items, { y: 60, opacity: 0 }, {
          y: 0, opacity: 1, stagger: 0.08, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: gridRef.current, start: 'top 80%' },
        });
      }
    });
    return () => ctx.revert();
  }, [habits]);

  const handleComplete = (id) => {
    setAnimatingId(id);
    gsap.to(`#habit-${id}`, { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' });
    completeHabit.mutate({ id });
    setTimeout(() => setAnimatingId(null), 500);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    createHabit.mutate(form);
    setForm({ name: '', icon: '📚', frequency: 'daily', color: '#6366f1' });
    setShowAdd(false);
  };

  // Generate mock heatmap data (90 days)
  const getHeatmap = () => {
    const cells = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      cells.push({
        date: d.toISOString().split('T')[0],
        value: Math.random() > 0.4 ? Math.floor(Math.random() * 4) : 0,
      });
    }
    return cells;
  };

  const heatmap = getHeatmap();

  // Weekly completion data
  const weeklyData = habits.map(h => ({
    name: h.name,
    value: Math.floor(Math.random() * 100),
    fill: h.color || '#6366f1',
  }));

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 bg-gradient-to-b from-cream via-soft-mint/20 to-cream">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Build the Discipline<br />That Builds You</h2>
          <p className="section-subtitle mt-4">Small daily wins. Massive long-term results.</p>
          <button onClick={() => setShowAdd(true)} className="mt-6 px-6 py-3 rounded-2xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #00C2A8, #14B8A6)' }}>
            + New Habit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Habits grid */}
          <div ref={gridRef} className="lg:col-span-2 space-y-4">
            {habits.map((habit) => (
              <div key={habit.id} id={`habit-${habit.id}`}
                className="habit-card glass-card p-5 flex items-center gap-5 hover-lift"
              >
                <span className="text-2xl">{habit.icon || '📚'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm" style={{ color: '#1a1a2e' }}>{habit.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${habit.frequency === 'daily' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                      {habit.frequency}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {heatmap.slice(0, 30).map((cell, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{
                        background: cell.value === 0 ? 'rgba(59,31,168,0.04)' :
                          cell.value === 1 ? 'rgba(0,194,168,0.3)' :
                            cell.value === 2 ? 'rgba(0,194,168,0.5)' :
                              cell.value === 3 ? 'rgba(0,194,168,0.7)' : 'rgba(0,194,168,0.9)',
                        transition: 'all 0.3s ease',
                      }} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-mono font-bold" style={{ color: habit.color || '#6366f1' }}>
                    {Math.floor(Math.random() * 14)}
                  </p>
                  <p className="text-[10px] text-indigo-400/40">day streak</p>
                </div>
                <button onClick={() => handleComplete(habit.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    animatingId === habit.id ? 'bg-mint text-white scale-110' : 'bg-indigo-50 text-indigo-300 hover:bg-mint hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="text-center py-16 text-indigo-400/40">
                <p className="text-4xl mb-2">🎯</p>
                <p>No habits yet. Start building your discipline!</p>
              </div>
            )}
          </div>

          {/* Weekly ring chart */}
          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>This Week's Score</h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart innerRadius="40%" outerRadius="90%" data={weeklyData.slice(0, 1)} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={30} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <p className="text-3xl font-mono font-bold text-mint">{Math.floor(Math.random() * 100)}%</p>
              <p className="text-xs text-indigo-400/40">completion rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">New Habit</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Habit Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="e.g. Morning Study" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Icon</label>
                  <input value={form.icon} onChange={e => setForm({...form, icon: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="📚" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Color</label>
                <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-full h-10 rounded-xl border border-indigo-100 cursor-pointer" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00C2A8, #14B8A6)' }}>Create Habit</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default HabitsSection;
