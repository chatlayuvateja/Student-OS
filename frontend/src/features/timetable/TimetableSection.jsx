import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTimetable, useCreateTimetableEntry, useDeleteTimetableEntry } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SUBJECT_COLORS = ['#6366f1', '#F5A623', '#FF6B6B', '#00C2A8', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6'];
const SUBJECT_ICONS = { 'Mathematics': '📐', 'Physics': '⚛️', 'Chemistry': '🧪', 'Data Structures': '🗃️', 'Algorithms': '🔢', 'English': '📖', 'History': '📜', 'Biology': '🧬', 'default': '📚' };

function TimetableSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gridRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ day_of_week: new Date().getDay(), subject_name: '', start_time: '', end_time: '', room: '', professor: '', color_tag: '#6366f1' });

  const { data: timetable = [] } = useTimetable();
  const createEntry = useCreateTimetableEntry();
  const deleteEntry = useDeleteTimetableEntry();
  const today = new Date().getDay();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { x: -100, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      if (gridRef.current) {
        gsap.fromTo(gridRef.current, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: gridRef.current, start: 'top 80%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntry.mutate(form);
    setShowModal(false);
    setForm({ day_of_week: new Date().getDay(), subject_name: '', start_time: '', end_time: '', room: '', professor: '', color_tag: '#6366f1' });
  };

  const getHours = () => {
    const hours = [];
    for (let i = 7; i <= 20; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
  };

  const getSubjectIcon = (name) => SUBJECT_ICONS[name] || SUBJECT_ICONS.default;

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36">
      <div className="section-container">
        <div ref={titleRef} className="mb-12 lg:mb-16">
          <h2 className="section-title">Your Day,<br />Perfectly Mapped</h2>
          <p className="section-subtitle mt-4">Every class, every room, every moment accounted for.</p>
          <button onClick={() => setShowModal(true)} className="mt-6 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)', color: 'white' }}>
            + Add Class
          </button>
        </div>

        {/* Weekly grid */}
        <div ref={gridRef} className="overflow-x-auto pb-4">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {DAYS.map((day, i) => (
                <div key={day} className={`text-center py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                  i === today ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200' : 'text-indigo-400/60'
                }`}>
                  {day.slice(0, 3)}
                  {i === today && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                </div>
              ))}
            </div>

            {/* Time slots */}
            {getHours().map((hour, idx) => (
              <div key={hour} className="grid grid-cols-7 gap-2 mb-1.5">
                <div className="text-xs text-indigo-400/40 font-mono pt-2 text-center">{hour}</div>
                {DAYS.map((_, dayIdx) => {
                  const classes = timetable.filter(t => t.day_of_week === dayIdx && t.start_time && t.start_time.startsWith(hour.slice(0, 2)));
                  return (
                    <div key={dayIdx} className={`min-h-[48px] rounded-xl p-1.5 relative transition-all ${
                      dayIdx === today ? 'bg-indigo-50/30 ring-1 ring-indigo-100' : 'bg-white/40'
                    }`}>
                      {classes.map(cls => (
                        <div key={cls.id} className="group relative p-1.5 rounded-lg text-xs cursor-pointer hover-lift"
                          style={{ background: cls.color_tag + '15', borderLeft: `3px solid ${cls.color_tag || '#6366f1'}` }}
                        >
                          <div className="flex items-center gap-1">
                            <span>{getSubjectIcon(cls.subject_name)}</span>
                            <span className="font-medium truncate" style={{ color: '#1a1a2e' }}>{cls.subject_name}</span>
                          </div>
                          <div className="text-[10px] text-indigo-400/50">{cls.room || ''}</div>
                          <button onClick={() => deleteEntry.mutate(cls.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-400 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">Add Class</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Subject</label>
                <input value={form.subject_name} onChange={e => setForm({...form, subject_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm" placeholder="e.g. Data Structures" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Day</label>
                  <select value={form.day_of_week} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm">
                    {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Color</label>
                  <input type="color" value={form.color_tag} onChange={e => setForm({...form, color_tag: e.target.value})} className="w-full h-10 rounded-xl border border-indigo-100 cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Start Time</label>
                  <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">End Time</label>
                  <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Room</label>
                  <input value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="Room 301" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Professor</label>
                  <input value={form.professor} onChange={e => setForm({...form, professor: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="Dr. Smith" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
                  Save Class
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">
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

export default TimetableSection;
