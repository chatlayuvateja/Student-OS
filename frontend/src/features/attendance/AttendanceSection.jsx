import React, { useState, useMemo, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTimetable } from '../../hooks/api';
import { useAttendanceSummary, useMarkAttendance } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function AttendanceSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState(null);
  const [slotModal, setSlotModal] = useState(null);

  const { data: timetable = [] } = useTimetable();
  const { data: summary } = useAttendanceSummary();
  const markAttendance = useMarkAttendance();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const attendancePct = summary?.present && summary?.total
    ? ((summary.present / summary.total) * 100).toFixed(1) : '0.0';

  const handleMarkStatus = (day, cls, status) => {
    const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
    markAttendance.mutate({
      subject_id: cls.id,
      date,
      status,
      timetable_slot_id: cls.id,
      student_id: 'student-1',
    });
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="mb-10">
          <p className="section-eyebrow">Tracking</p>
          <h2 className="section-heading">Attendance *overview*</h2>
          <p className="section-subtext">Monitor your class attendance.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card p-5 text-center">
            <p className="text-2xl font-display italic text-text-primary">{attendancePct}%</p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Attendance</p>
          </div>
          <div className="glass-card p-5 text-center">
            <p className="text-2xl font-display italic text-text-primary">{summary?.present || 0}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Present</p>
          </div>
          <div className="glass-card p-5 text-center">
            <p className="text-2xl font-display italic text-text-primary">{summary?.absent || 0}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Absent</p>
          </div>
          <div className="glass-card p-5 text-center">
            <p className="text-2xl font-display italic text-text-primary">{summary?.leave || 0}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Leaves</p>
          </div>
        </div>

        {/* Calendar */}
        <div className="glass-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between p-4 border-b border-stroke">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(p => p - 1); } else setCurrentMonth(p => p - 1); }}
              className="text-muted hover:text-text-primary transition-all text-sm px-3 py-1">←</button>
            <p className="text-sm font-medium text-text-primary">{MONTHS[currentMonth]} {currentYear}</p>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(p => p + 1); } else setCurrentMonth(p => p + 1); }}
              className="text-muted hover:text-text-primary transition-all text-sm px-3 py-1">→</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-stroke">
            {DAYS.map(d => (
              <div key={d} className="p-2 text-center">
                <span className="text-[9px] text-muted uppercase tracking-wider">{d.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2 bg-stroke/10" />
            ))}
            {calendarDays.map(day => {
              const daySlots = timetable.filter(s => s.day_of_week === new Date(currentYear, currentMonth, day).getDay());
              return (
                <div key={day} className="p-1.5 border-b border-r border-stroke last:border-r-0 min-h-[60px] hover:bg-surface/20 transition-colors">
                  <span className="text-[10px] text-muted">{day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {daySlots.slice(0, 2).map(cls => (
                      <div key={cls.id}
                        className="text-[8px] px-1 py-0.5 rounded-md truncate cursor-pointer transition-all hover:brightness-125"
                        style={{ background: (cls.color_tag || '#89AACC') + '20', color: cls.color_tag || '#89AACC' }}
                        onClick={() => {
                          const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
                          setSlotModal({ day, cls, date });
                        }}
                      >
                        {cls.subject_name?.slice(0, 8)}
                      </div>
                    ))}
                    {daySlots.length > 2 && (
                      <span className="text-[7px] text-muted">+{daySlots.length - 2} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slot Action Modal */}
      {slotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSlotModal(null)}>
          <div className="glass-card-strong p-8 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="mb-6">
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: (slotModal.cls.color_tag || '#89AACC') + '18', color: slotModal.cls.color_tag || '#89AACC' }}>
                {slotModal.cls.subject_name}
              </div>
              <p className="text-lg font-display italic text-text-primary">Mark Attendance</p>
              <p className="text-xs text-muted mt-1">
                {MONTHS[currentMonth]} {slotModal.day}, {currentYear} &nbsp;·&nbsp;
                {slotModal.cls.start_time} – {slotModal.cls.end_time}
                {slotModal.cls.room ? ` · Room ${slotModal.cls.room}` : ''}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95"
                style={{ borderColor: '#00C2A8', background: 'rgba(0,194,168,0.05)' }}
                onClick={() => { handleMarkStatus(slotModal.day, slotModal.cls, 'present'); setSlotModal(null); }}>
                <span className="text-2xl">✅</span>
                <span className="text-xs font-semibold" style={{ color: '#00C2A8' }}>Present</span>
              </button>
              <button className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95"
                style={{ borderColor: '#FF6B6B', background: 'rgba(255,107,107,0.05)' }}
                onClick={() => { handleMarkStatus(slotModal.day, slotModal.cls, 'absent'); setSlotModal(null); }}>
                <span className="text-2xl">❌</span>
                <span className="text-xs font-semibold" style={{ color: '#FF6B6B' }}>Absent</span>
              </button>
              <button className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95"
                style={{ borderColor: '#F5A623', background: 'rgba(245,166,35,0.05)' }}
                onClick={() => {
                  const total = (summary?.total || 0) + 1;
                  const present = summary?.present || 0;
                  const currentPct = total > 1 ? ((present) / (total - 1)) * 100 : 100;
                  const newPct = (present / total) * 100;
                  setLeaveData({
                    day: slotModal.day, cls: slotModal.cls, date: slotModal.date,
                    currentPercentage: currentPct, newPercentage: newPct,
                    delta: newPct - currentPct,
                    remainingLeaves: Math.max(0, Math.floor(present - 0.75 * total)),
                  });
                  setSlotModal(null);
                  setShowLeaveModal(true);
                }}>
                <span className="text-2xl">🟡</span>
                <span className="text-xs font-semibold" style={{ color: '#F5A623' }}>Leave</span>
              </button>
            </div>
            <button className="w-full mt-4 py-2 text-xs text-muted hover:text-text-primary transition-all"
              onClick={() => setSlotModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Leave Warning Modal */}
      {showLeaveModal && leaveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <p className="text-base font-display italic text-text-primary mb-4">Leave Warning</p>
            <div className="space-y-3 mb-6">
              <p className="text-sm text-muted">
                Current: <span className="text-text-primary font-medium">{leaveData.currentPercentage.toFixed(1)}%</span>
              </p>
              <p className="text-sm text-muted">
                After leave: <span className="text-[#F5A623] font-medium">{leaveData.newPercentage.toFixed(1)}%</span>
              </p>
              <p className="text-sm font-medium" style={{ color: '#F5A623' }}>
                ⚠️ Taking this leave will reduce your attendance by{' '}
                <span className="text-base font-bold">{Math.abs(leaveData.delta).toFixed(2)}%</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#b45309' }}>
                {leaveData.newPercentage < 75
                  ? '🚨 You will fall below the 75% minimum threshold!'
                  : 'You will still be above the 75% threshold.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { handleMarkStatus(leaveData.day, leaveData.cls, 'leave'); setShowLeaveModal(false); }}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-bg bg-text-primary transition-all hover:opacity-90">
                Confirm Leave
              </button>
              <button onClick={() => setShowLeaveModal(false)}
                className="px-6 py-3 rounded-xl text-sm text-muted border border-stroke hover:text-text-primary transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AttendanceSection;
