import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAttendanceSummary, useMarkAttendance, useTimetable } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AttendanceSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState(null);

  const { data: summary } = useAttendanceSummary();
  const { data: timetable = [] } = useTimetable();
  const markAttendance = useMarkAttendance();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  const today = new Date();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  // Get classes for a specific day
  const getDayClasses = (day) => {
    if (!day) return [];
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    return timetable.filter(t => t.day_of_week === dayOfWeek);
  };

  const handleStatusClick = (day, cls, status) => {
    if (status === 'leave') {
      // Show leave impact modal
      const total = summary?.total || 1;
      const present = summary?.present || 0;
      const currentPct = (present / total) * 100;
      const newPct = (present / (total + 1)) * 100;
      setLeaveData({
        day,
        cls,
        currentPercentage: currentPct,
        newPercentage: newPct,
        delta: newPct - currentPct,
        remainingLeaves: Math.floor((75 / 100 * (total + 1) - present) / 0.75),
      });
      setShowLeaveModal(true);
      return;
    }
    markAttendance.mutate({
      subject_id: cls.id,
      date: new Date(currentYear, currentMonth, day).toISOString().split('T')[0],
      status,
      timetable_slot_id: cls.id,
    });
  };

  const confirmLeave = () => {
    if (leaveData) {
      markAttendance.mutate({
        subject_id: leaveData.cls.id,
        date: new Date(currentYear, currentMonth, leaveData.day).toISOString().split('T')[0],
        status: 'leave',
        timetable_slot_id: leaveData.cls.id,
      });
    }
    setShowLeaveModal(false);
    setLeaveData(null);
  };

  const colorByPct = (pct) => {
    if (pct >= 75) return '#00C2A8';
    if (pct >= 65) return '#F5A623';
    return '#FF6B6B';
  };

  const isToday = (day) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Never Miss<br />What Matters</h2>
          <p className="section-subtitle mt-4">Your attendance, your responsibility.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 glass-card p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(prev => prev - 1); } else setCurrentMonth(prev => prev - 1); }}
                className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-all">&lt;</button>
              <h3 className="text-lg font-display font-semibold" style={{ color: '#1a1a2e' }}>{MONTHS[currentMonth]} {currentYear}</h3>
              <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(prev => prev + 1); } else setCurrentMonth(prev => prev + 1); }}
                className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-all">&gt;</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-indigo-400/40 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const classes = getDayClasses(day);
                return (
                  <div key={i} className={`min-h-[80px] p-1.5 rounded-xl transition-all ${
                    isToday(day) ? 'bg-indigo-50 ring-2 ring-indigo-200' : 'hover:bg-indigo-50/30'
                  } ${!day ? 'invisible' : ''}`}>
                    {day && (
                      <>
                        <span className={`text-[10px] font-medium ${isToday(day) ? 'text-indigo-600' : 'text-indigo-400/40'}`}>{day}</span>
                        <div className="mt-1 space-y-0.5">
                          {classes.slice(0, 3).map(cls => (
                            <div key={cls.id} className="group relative">
                              <div className="text-[8px] px-1 py-0.5 rounded-md truncate cursor-pointer transition-all"
                                style={{ background: cls.color_tag + '20', color: cls.color_tag }}
                                onClick={() => setSelectedSlot({ day, cls })}
                              >
                                {cls.subject_name?.slice(0, 8)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="glass-card p-6 text-center">
              <p className="text-5xl font-mono font-bold" style={{ color: colorByPct(summary?.percentage || 0) }}>
                {summary?.percentage?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-indigo-400/40 mt-1">Overall Attendance</p>
              <div className="flex justify-center gap-4 mt-4 text-xs text-indigo-400/60">
                <span>P: {summary?.present || 0}</span>
                <span>A: {summary?.absent || 0}</span>
                <span>L: {summary?.leave || 0}</span>
              </div>
            </div>

            {/* Per-subject rings */}
            <div className="glass-card p-5">
              <h4 className="text-xs font-semibold mb-3" style={{ color: '#1a1a2e' }}>By Subject</h4>
              <div className="space-y-3">
                {['Data Structures', 'Algorithms', 'Mathematics', 'Physics'].map(sub => {
                  const pct = Math.random() * 40 + 60;
                  return (
                    <div key={sub} className="flex items-center gap-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <svg width="40" height="40" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(59,31,168,0.06)" strokeWidth="4" />
                          <circle cx="20" cy="20" r="16" fill="none" stroke={colorByPct(pct)} strokeWidth="4"
                            strokeDasharray={`${pct * 1.0} 100`} strokeLinecap="round"
                            transform="rotate(-90 20 20)" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#1a1a2e' }}>{sub}</p>
                        <p className="text-[10px] text-indigo-400/40">{pct.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status badge */}
            <div className={`glass-card p-4 text-center ${
              (summary?.percentage || 0) >= 75 ? 'border-mint/20' : (summary?.percentage || 0) >= 65 ? 'border-gold/20' : 'border-coral/20'
            }`}
              style={{ borderWidth: '1px', borderStyle: 'solid' }}
            >
              <p className="text-xs font-medium" style={{ color: colorByPct(summary?.percentage || 0) }}>
                {(summary?.percentage || 0) >= 75 ? '✅ Excellent Attendance' :
                 (summary?.percentage || 0) >= 65 ? '⚠️ Needs Attention' : '❌ Critical'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Impact Modal */}
      {showLeaveModal && leaveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-2">Request Leave</h3>
            <p className="text-sm text-indigo-400/60 mb-6">{leaveData.cls.subject_name} · {MONTHS[currentMonth]} {leaveData.day}</p>
            <div className="space-y-4">
              <div className="glass-card p-4 bg-yellow-50/50">
                <p className="text-sm font-medium" style={{ color: '#F5A623' }}>
                  ⚠️ This will decrease your attendance by {Math.abs(leaveData.delta).toFixed(1)}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="glass-card p-3 text-center">
                  <p className="text-[10px] text-indigo-400/40">Current</p>
                  <p className="text-lg font-mono font-bold" style={{ color: colorByPct(leaveData.currentPercentage) }}>{leaveData.currentPercentage.toFixed(1)}%</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-[10px] text-indigo-400/40">Projected</p>
                  <p className="text-lg font-mono font-bold" style={{ color: colorByPct(leaveData.newPercentage) }}>{leaveData.newPercentage.toFixed(1)}%</p>
                </div>
              </div>
              <p className="text-xs text-center text-indigo-400/40">
                You have approximately <span className="font-semibold text-indigo-500">{Math.max(0, leaveData.remainingLeaves)}</span> leaves remaining before falling below 75%.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={confirmLeave} className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #F5A623, #FF6B6B)' }}>
                  Confirm Leave
                </button>
                <button onClick={() => setShowLeaveModal(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AttendanceSection;
