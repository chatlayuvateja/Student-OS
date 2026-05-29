import React, { useState, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import toast from 'react-hot-toast';
import { useTimetable, useCreateTimetableEntry, useUpdateTimetableEntry, useProfile, useWorkingDaysConfig } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PERIODS = [
  { name: 'Period 1', start: '09:00', end: '09:55' },
  { name: 'Period 2', start: '09:55', end: '10:50' },
  { name: 'Period 3', start: '10:50', end: '11:45' },
  { name: 'Period 4', start: '11:45', end: '12:40' },
  { name: 'Lunch Break', start: '12:40', end: '13:20', isBreak: true },
  { name: 'Period 5', start: '13:20', end: '14:15' },
  { name: 'Period 6', start: '14:15', end: '15:10' },
  { name: 'Period 7', start: '15:10', end: '16:05' },
];

function getWeekDates(currentDate) {
  const start = new Date(currentDate);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function findPeriodIndex(startTime) {
  return PERIODS.findIndex(p => p.start === startTime);
}

function TimetableSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [form, setForm] = useState({
    subject_name: '',
    period_index: 0,
    start_time: PERIODS[0].start,
    end_time: PERIODS[0].end,
    room: '',
    professor: '',
    color_tag: '#3B1FA8',
    day_of_week: 1,
  });

  const { data: timetable = [] } = useTimetable();
  const { data: profile } = useProfile();
  const { data: workingDaysConfig } = useWorkingDaysConfig();
  const createEntry = useCreateTimetableEntry();
  const updateEntry = useUpdateTimetableEntry();

  const workingDays = workingDaysConfig?.working_days || [1, 2, 3, 4, 5];

  const subjectOptions = React.useMemo(() => {
    if (!profile?.subjects || !Array.isArray(profile.subjects)) return [];
    return profile.subjects.map(s => typeof s === 'string' ? { name: s, color: '#89AACC' } : s);
  }, [profile]);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const getSlotsForDayAndPeriod = (dayIndex, periodStart) =>
    timetable.filter(s => s.day_of_week === dayIndex && s.start_time === periodStart);

  const handleCreate = () => {
    setEditingSlot(null);
    setForm({
      subject_name: '',
      period_index: 0,
      start_time: PERIODS[0].start,
      end_time: PERIODS[0].end,
      room: '',
      professor: '',
      color_tag: '#3B1FA8',
      day_of_week: 1,
    });
    setShowModal(true);
  };

  const handleEdit = (slot) => {
    setEditingSlot(slot);
    const pi = findPeriodIndex(slot.start_time);
    setForm({
      subject_name: slot.subject_name,
      period_index: pi >= 0 ? pi : 0,
      start_time: slot.start_time,
      end_time: slot.end_time,
      room: slot.room || '',
      professor: slot.professor || '',
      color_tag: slot.color_tag || '#3B1FA8',
      day_of_week: slot.day_of_week,
    });
    setShowModal(true);
  };

  const handlePeriodChange = (e) => {
    const pi = Number(e.target.value);
    setForm(p => ({ ...p, period_index: pi, start_time: PERIODS[pi].start, end_time: PERIODS[pi].end }));
  };

  // Close modal only on success; show error toast on failure
  const handleSubmit = (e) => {
    e.preventDefault();
    const { period_index, ...payload } = form;
    if (editingSlot) {
      updateEntry.mutate(
        { id: editingSlot.id, ...payload },
        {
          onSuccess: () => setShowModal(false),
          onError: () => toast.error('Failed to update class. Please try again.'),
        }
      );
    } else {
      createEntry.mutate(
        payload,
        {
          onSuccess: () => setShowModal(false),
          onError: () => toast.error('Failed to add class. Please try again.'),
        }
      );
    }
  };

  const periodIcons = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '🍽️', '5️⃣', '6️⃣', '7️⃣'];

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="flex items-center justify-between mb-10">
          <div>
            <p className="section-eyebrow">Schedule</p>
            <h2 className="section-heading">Weekly *timetable*</h2>
          </div>
          <button onClick={handleCreate} className="btn-primary text-xs px-5 py-2.5">
            + Add Class
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="glass-card overflow-hidden">
          {/* Header with day names */}
          <div className="grid grid-cols-7 border-b border-stroke">
            {weekDates.map((date, i) => {
              const isDayOff = !workingDays.includes(date.getDay());
              return (
                <div key={i} className={`p-3 text-center border-r border-stroke last:border-r-0 ${isDayOff ? 'bg-stroke/10' : ''}`}>
                  <p className="text-[10px] text-muted uppercase tracking-wider">{DAYS[date.getDay()].slice(0, 3)}</p>
                  <p className="text-lg font-semibold text-text-primary mt-0.5">{date.getDate()}</p>
                  {isDayOff && (
                    <span className="text-[7px] text-muted/50 font-medium tracking-wider bg-surface/30 px-1.5 py-0.5 rounded-full block mt-0.5">
                      Holiday
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Period rows */}
          <div className="overflow-y-auto" style={{ maxHeight: '520px' }}>
            {PERIODS.map((period, pi) => (
              <div key={pi}
                className={`grid grid-cols-7 border-b border-stroke transition-colors ${
                  period.isBreak ? 'bg-stroke/10 hover:bg-stroke/20' : 'hover:bg-surface/30'
                }`}
              >
                {/* Period label */}
                <div className={`p-2 border-r border-stroke flex items-center justify-center ${period.isBreak ? 'py-3' : 'pt-3'}`}>
                  <div className="text-center">
                    <span className={`block ${period.isBreak ? 'text-[9px]' : 'text-[9px]'} text-muted font-medium`}>
                      {periodIcons[pi]} {period.name}
                    </span>
                    <span className="text-[8px] text-muted/60">{period.start} – {period.end}</span>
                  </div>
                </div>

                {/* Day columns */}
                {weekDates.map((date, di) => {
                  const isDayOff = !workingDays.includes(date.getDay());
                  // Non-working day column — show existing entries as grayed out
                  if (isDayOff) {
                    const dayOffSlots = getSlotsForDayAndPeriod(date.getDay(), period.start);
                    return (
                      <div key={di}
                        className="p-1 border-r border-stroke last:border-r-0 min-h-[44px] bg-stroke/10 relative"
                      >
                        {pi === 0 && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                            <span className="text-[8px] text-muted/50 font-medium tracking-wider bg-surface/50 px-1.5 py-0.5 rounded-full">
                              Holiday
                            </span>
                          </div>
                        )}
                        {dayOffSlots.map((slot, si) => (
                          <div
                            key={si}
                            className="text-[10px] px-2 py-1 rounded-md mb-0.5 truncate opacity-40 line-through"
                            style={{
                              background: (slot.color_tag || '#3B1FA8') + '15',
                              color: slot.color_tag || '#3B1FA8',
                              borderLeft: `3px solid ${(slot.color_tag || '#3B1FA8') + '40'}`
                            }}
                            title={`${slot.subject_name} (inactive — ${DAYS[date.getDay()]} is a holiday)`}
                          >
                            {slot.subject_name}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  // Lunch break — non-clickable
                  if (period.isBreak) {
                    return (
                      <div key={di}
                        className="p-2 border-r border-stroke last:border-r-0 flex items-center justify-center"
                      />
                    );
                  }

                  const slots = getSlotsForDayAndPeriod(di, period.start);
                  return (
                    <div key={di} className="p-1 border-r border-stroke last:border-r-0 min-h-[44px] relative">
                      {slots.map((slot, si) => (
                        <div
                          key={si}
                          className="text-[10px] px-2 py-1 rounded-md mb-0.5 cursor-pointer transition-all hover:brightness-125 truncate"
                          style={{ background: (slot.color_tag || '#3B1FA8') + '25', color: slot.color_tag || '#3B1FA8', borderLeft: `3px solid ${slot.color_tag || '#3B1FA8'}` }}
                          onClick={() => handleEdit(slot)}
                          title={`${slot.subject_name}\n${slot.start_time}–${slot.end_time}\n${slot.room ? 'Room: '+slot.room : ''}`}
                        >
                          {slot.subject_name}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display italic text-text-primary mb-6">
              {editingSlot ? 'Edit Class' : 'Add Class'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">Subject</label>
                {subjectOptions.length > 0 ? (
                  <select value={form.subject_name} onChange={e => setForm(p => ({ ...p, subject_name: e.target.value }))} required
                    className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                    <option value="">Select a subject...</option>
                    {subjectOptions.map((s, i) => (
                      <option key={i} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" placeholder="Subject Name" value={form.subject_name} onChange={e => setForm(p => ({ ...p, subject_name: e.target.value }))} required
                    className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                )}
              </div>

              {/* Period selector instead of free-text time inputs */}
              <div>
                <label className="text-[10px] text-muted uppercase tracking-wider block mb-1.5">Class Period</label>
                <select value={form.period_index} onChange={handlePeriodChange}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                  {PERIODS.map((p, i) => (
                    <option key={i} value={i} disabled={p.isBreak}>
                      {p.isBreak ? `——— ${p.name} (${p.start}–${p.end}) ———` : `${p.name}: ${p.start} – ${p.end}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Room" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
                <input type="text" placeholder="Professor" value={form.professor} onChange={e => setForm(p => ({ ...p, professor: e.target.value }))}
                  className="px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all" />
              </div>

              {/* Day dropdown — only working days for adding classes */}
              <select value={form.day_of_week} onChange={e => setForm(p => ({ ...p, day_of_week: Number(e.target.value) }))}
                className="w-full px-4 py-3 rounded-xl text-sm bg-surface border border-stroke text-text-primary focus:outline-none focus:border-text-primary/30 transition-all">
                {workingDays.map(dayIndex => (
                  <option key={dayIndex} value={dayIndex}>{DAYS[dayIndex]}</option>
                ))}
              </select>

              <input type="color" value={form.color_tag} onChange={e => setForm(p => ({ ...p, color_tag: e.target.value }))}
                className="w-full h-10 rounded-xl cursor-pointer bg-surface border border-stroke" />

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createEntry.isPending || updateEntry.isPending}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90 disabled:opacity-40">
                  {createEntry.isPending || updateEntry.isPending ? 'Saving...' : editingSlot ? 'Update' : 'Create'}
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

export default TimetableSection;
