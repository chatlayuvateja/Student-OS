import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useQueries } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import api from '../../hooks/api';
import { useHabits, useCreateHabit, useCompleteHabit } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const ICONS = ['📌', '📚', '🏃', '💻', '🎯', '🧠', '🎨', '🌱', '💪', '🧘', '📝', '🎵', '☕', '💧', '😴'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function HabitsSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📌', frequency: 'daily', color: '#89AACC' });
  const [showReports, setShowReports] = useState(false);
  const [reportTab, setReportTab] = useState('Weekly');
  const [tooltip, setTooltip] = useState(null);

  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();
  const [completing, setCompleting] = useState(null);

  // Fetch all habits' histories in parallel
  const habitHistories = useQueries({
    queries: habits.map(habit => ({
      queryKey: ['habit-history', habit.id],
      queryFn: async () => {
        const { data } = await api.get(`/habits/${habit.id}/history`);
        return data.data || [];
      },
      enabled: habits.length > 0,
      staleTime: 30000,
    })),
  });

  // Build completion map: { habitId -> Set<dateString> }
  const completionMap = useMemo(() => {
    const map = {};
    habits.forEach((habit, i) => {
      const data = habitHistories[i]?.data || [];
      map[habit.id] = new Set(data.map(c => c.completed_date));
    });
    return map;
  }, [habits, habitHistories]);

  const today = useMemo(() => todayStr(), []);

  const isCompletedToday = useCallback((habitId) => {
    return completionMap[habitId]?.has(today) ?? false;
  }, [completionMap, today]);

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

  // ====== Weekly Chart Data ======
  const weeklyData = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates.map(date => {
      const entry = { date, label: new Date(date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) };
      habits.forEach(habit => {
        entry[habit.name] = completionMap[habit.id]?.has(date) ? 1 : 0;
      });
      return entry;
    });
  }, [habits, completionMap]);

  // ====== Monthly Heatmap Data ======
  const monthlyData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      const dayOfWeek = new Date(year, month, d).getDay();
      days.push({ day: d, dateStr, dayOfWeek, isToday: dateStr === today });
    }
    // Pad with empty cells before first day
    const padded = Array.from({ length: firstDay }, (_, i) => ({ empty: true, key: `pad-${i}` })).concat(days);
    return { year, month, padded, daysInMonth, monthName: MONTHS[month] };
  }, [today]);

  // ====== Yearly Heatmap Data ======
  const yearlyData = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    // Move to start of week (Sunday)
    oneYearAgo.setDate(oneYearAgo.getDate() - oneYearAgo.getDay());

    const cells = [];
    const current = new Date(oneYearAgo);
    while (current <= now) {
      const dateStr = current.toISOString().split('T')[0];
      cells.push({
        date: dateStr,
        dayOfWeek: current.getDay(),
        isToday: dateStr === today,
      });
      current.setDate(current.getDate() + 1);
    }

    // Group by week
    const weeks = [];
    let currentWeek = [];
    cells.forEach((cell, i) => {
      if (i > 0 && cell.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return weeks;
  }, [today]);

  // Build full completion data for yearly tooltips
  const allCompletions = useMemo(() => {
    const map = {};
    habits.forEach((habit, i) => {
      const data = habitHistories[i]?.data || [];
      data.forEach(c => {
        if (!map[c.completed_date]) map[c.completed_date] = [];
        map[c.completed_date].push({ name: habit.name, color: habit.color, note: c.note || '' });
      });
    });
    return map;
  }, [habits, habitHistories]);

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Tracking</p>
            <h2 className="section-heading">Daily *habits*</h2>
            <p className="section-subtext">Build consistent routines.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowReports(!showReports); if (!showReports) setReportTab('Weekly'); }}
              className="px-5 py-2.5 rounded-xl text-xs font-medium border border-stroke text-muted hover:text-text-primary hover:border-text-primary/30 transition-all">
              {showReports ? 'Hide Reports' : 'View Reports'}
            </button>
            <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-5 py-2.5">
              + New Habit
            </button>
          </div>
        </div>

        {/* Habits Grid */}
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {habits.map(habit => {
            const done = isCompletedToday(habit.id);
            return (
              <div key={habit.id}
                className={`glass-card p-5 flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.02] ${done ? 'ring-1' : ''}`}
                style={done ? { background: `linear-gradient(135deg, ${habit.color}08, ${habit.color}18)`, boxShadow: `0 0 20px ${habit.color}10` } : {}}
              >
                <span className={`text-2xl mb-3 transition-all duration-300 ${done ? 'opacity-70' : ''}`}>{habit.icon}</span>
                <h3 className={`text-sm font-medium mb-1 transition-all duration-300 ${done ? 'line-through opacity-60 text-muted' : 'text-text-primary'}`}>
                  {habit.name}
                </h3>
                {done && (
                  <span className="text-[10px] font-semibold mb-2" style={{ color: '#00C2A8' }}>
                    ✓ Completed today
                  </span>
                )}
                <div className="flex items-center gap-2 text-[10px] text-muted mb-3">
                  <span className="uppercase tracking-wider">{habit.frequency}</span>
                </div>
                <button
                  onClick={() => handleComplete(habit)}
                  disabled={completing === habit.id || done}
                  className="w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-40"
                  style={{ borderColor: done ? '#00C2A8' : (habit.color || '#89AACC'), background: done ? 'rgba(0,194,168,0.15)' : 'transparent' }}
                >
                  {completing === habit.id ? (
                    <span className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                  ) : done ? (
                    <span style={{ color: '#00C2A8', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
                  ) : (
                    <span style={{ color: habit.color || '#89AACC' }}>✓</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Reports Panel */}
        {showReports && (
          <div className="mt-10 glass-card overflow-hidden">
            {/* Tab buttons */}
            <div className="flex border-b border-stroke">
              {['Weekly', 'Monthly', 'Yearly'].map(tab => (
                <button key={tab}
                  onClick={() => setReportTab(tab)}
                  className={`px-6 py-3.5 text-xs font-medium transition-all relative ${
                    reportTab === tab
                      ? 'text-text-primary'
                      : 'text-muted hover:text-text-primary'
                  }`}
                >
                  {tab}
                  {reportTab === tab && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: '#89AACC' }} />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* ====== WEEKLY ====== */}
              {reportTab === 'Weekly' && (
                <div>
                  <p className="text-xs text-muted mb-4">Past 7 days — completions per habit</p>
                  {weeklyData.length > 0 && habits.length > 0 ? (
                    <div className="w-full" style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis
                            dataKey="label"
                            tick={{ fill: 'hsl(var(--muted))', fontSize: 10 }}
                            axisLine={{ stroke: 'hsl(var(--stroke))' }}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: 'hsl(var(--muted))', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--surface))',
                              border: '1px solid hsl(var(--stroke))',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: 'hsl(var(--text-primary))',
                            }}
                          />
                          <Legend
                            wrapperStyle={{ fontSize: '10px', color: 'hsl(var(--text-primary))' }}
                          />
                          {habits.map(habit => (
                            <Bar key={habit.id} dataKey={habit.name} fill={habit.color || '#89AACC'} radius={[2, 2, 0, 0]} maxBarSize={16} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">No habit data yet. Complete some habits to see your weekly report.</p>
                  )}
                </div>
              )}

              {/* ====== MONTHLY ====== */}
              {reportTab === 'Monthly' && (
                <div>
                  <p className="text-xs text-muted mb-4">{monthlyData.monthName} — daily completions per habit</p>
                  {habits.length > 0 ? (
                    <div className="space-y-6">
                      {habits.map(habit => {
                        const habitCompletions = completionMap[habit.id] || new Set();
                        return (
                          <div key={habit.id}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium" style={{ color: habit.color || '#89AACC' }}>{habit.icon} {habit.name}</span>
                            </div>
                            <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 16px)', gridTemplateRows: `repeat(${Math.ceil((monthlyData.padded.length) / 7)}, 16px)` }}>
                              {monthlyData.padded.map((cell, i) => {
                                if (cell.empty) {
                                  return <div key={cell.key} className="w-4 h-4" />;
                                }
                                const completed = habitCompletions.has(cell.dateStr);
                                return (
                                  <div
                                    key={cell.day}
                                    className="w-4 h-4 rounded-sm transition-all duration-200"
                                    style={{
                                      background: completed ? (habit.color || '#89AACC') : 'hsl(var(--stroke))',
                                      opacity: completed ? 1 : 0.3,
                                      border: cell.isToday ? '1px solid hsl(var(--text-primary))' : 'none',
                                    }}
                                    title={`${cell.dateStr}${completed ? ' ✓' : ''}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">No habits yet. Create one to track your monthly progress.</p>
                  )}
                </div>
              )}

              {/* ====== YEARLY ====== */}
              {reportTab === 'Yearly' && (
                <div>
                  <p className="text-xs text-muted mb-4">Past 365 days — contribution heatmap per habit</p>
                  {habits.length > 0 ? (
                    <div className="space-y-8">
                      {habits.map(habit => {
                        const habitCompletions = completionMap[habit.id] || new Set();
                        return (
                          <div key={habit.id}>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium" style={{ color: habit.color || '#89AACC' }}>{habit.icon} {habit.name}</span>
                            </div>
                            <div className="overflow-x-auto pb-2">
                              <div className="flex gap-[3px]" style={{ minWidth: Math.max(yearlyData.length * 13, 300) }}>
                                {yearlyData.map((week, wi) => (
                                  <div key={wi} className="flex flex-col gap-[3px]">
                                    {[0, 1, 2, 3, 4, 5, 6].map(dow => {
                                      const cell = week.find(c => c.dayOfWeek === dow);
                                      if (!cell) return <div key={dow} className="w-[10px] h-[10px]" />;
                                      const completed = habitCompletions.has(cell.date);
                                      const cellCompletions = allCompletions[cell.date] || [];
                                      const habitCompletion = cellCompletions.find(c => c.name === habit.name);
                                      const note = habitCompletion?.note || '';
                                      return (
                                        <div
                                          key={cell.date}
                                          className="w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-all duration-150 hover:scale-150 hover:z-10 relative"
                                          style={{
                                            background: completed ? (habit.color || '#89AACC') : 'hsl(var(--stroke))',
                                            opacity: completed ? 1 : 0.2,
                                            border: cell.isToday ? '1px solid hsl(var(--text-primary))' : 'none',
                                          }}
                                          onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setTooltip({
                                              x: rect.left + rect.width / 2,
                                              y: rect.top - 8,
                                              date: cell.date,
                                              completed,
                                              note,
                                            });
                                          }}
                                          onMouseLeave={() => setTooltip(null)}
                                        />
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Legend */}
                      <div className="flex items-center gap-2 text-[9px] text-muted">
                        <span>Less</span>
                        <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: 'hsl(var(--stroke))', opacity: 0.2 }} />
                        <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: '#89AACC', opacity: 0.3 }} />
                        <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: '#89AACC', opacity: 0.6 }} />
                        <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: '#89AACC', opacity: 1 }} />
                        <span>More</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">No habits yet. Create one to see your yearly contributions.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[100] pointer-events-none transition-opacity duration-150"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="glass-card-strong px-3 py-2 text-xs whitespace-nowrap">
            <p className="text-text-primary font-medium">{tooltip.date}</p>
            <p className="text-muted mt-0.5" style={{ color: tooltip.completed ? '#00C2A8' : 'hsl(var(--muted))' }}>
              {tooltip.completed ? '✓ Completed' : 'No entry'}
            </p>
            {tooltip.note && <p className="text-muted/70 mt-0.5 italic max-w-[200px] truncate">{tooltip.note}</p>}
          </div>
        </div>
      )}

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
