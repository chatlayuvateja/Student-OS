import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import toast from 'react-hot-toast';
import { useTimetable, useAttendanceSummary, useMarkAttendance, useProfile, useWorkingDaysConfig } from '../../hooks/api';
import WorkingDaysConfig from './WorkingDaysConfig';

gsap.registerPlugin(ScrollTrigger);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DEFAULT_THRESHOLD = 75;

function AttendanceSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dayModal, setDayModal] = useState(null);
  const [markedSlots, setMarkedSlots] = useState({});
  const [bunkMode, setBunkMode] = useState(false);
  const [bunkSelections, setBunkSelections] = useState({});
  const [showAbsentWarning, setShowAbsentWarning] = useState(false);
  const [showBunkWarning, setShowBunkWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: timetable = [] } = useTimetable();
  const { data: summary } = useAttendanceSummary();
  const { data: profile } = useProfile();
  const { data: workingDaysConfig } = useWorkingDaysConfig();
  const markAttendance = useMarkAttendance();

  const threshold = profile?.attendance_threshold || DEFAULT_THRESHOLD;
  const workingDays = workingDaysConfig?.working_days || [1, 2, 3, 4, 5];
  const holidays = workingDaysConfig?.holidays || [];
  const holidayDates = new Set(holidays.map(h => h.date));

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

  // Calculate attendance impact for a set of classes being marked absent/bunk
  const calculateImpact = useCallback((numClassesBeingMarked, numPresentAmongThem = 0) => {
    const total = (summary?.total || 0) + numClassesBeingMarked;
    const present = (summary?.present || 0) + numPresentAmongThem;
    const currentPct = summary?.total > 0 ? ((summary.present || 0) / summary.total) * 100 : 100;
    const newPct = total > 0 ? (present / total) * 100 : 0;
    const delta = newPct - currentPct;

    // Z = present days needed to recover to threshold
    // (present + Z) / (total + Z) >= threshold/100
    let z = 0;
    if (newPct < threshold) {
      z = Math.ceil(Math.max(0, (threshold * total - 100 * present) / (100 - threshold)));
    }

    return { total, present, currentPct, newPct, delta, z, isCritical: newPct < threshold };
  }, [summary, threshold]);

  const handleMarkSlot = useCallback((day, cls, status, dateStr) => {
    const date = dateStr || new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
    markAttendance.mutate({
      subject_id: cls.id,
      date,
      status,
      timetable_slot_id: cls.id,
      student_id: 'student-1',
    });
    setMarkedSlots(prev => ({ ...prev, [cls.id]: status }));
  }, [currentYear, currentMonth, markAttendance]);

  const openDayModal = useCallback((day, date, slots) => {
    setDayModal({ day, month: currentMonth, year: currentYear, date, slots });
    setMarkedSlots({});
    setBunkMode(false);
    setBunkSelections({});
    setShowAbsentWarning(false);
    setShowBunkWarning(false);
  }, [currentMonth, currentYear]);

  const closeDayModal = useCallback(() => {
    setDayModal(null);
    setMarkedSlots({});
    setBunkMode(false);
    setBunkSelections({});
    setShowAbsentWarning(false);
    setShowBunkWarning(false);
  }, []);

  // Mark all classes this day as present
  const handleMarkAllPresent = useCallback(async () => {
    if (!dayModal) return;
    setIsSubmitting(true);
    const date = dayModal.date;
    try {
      await Promise.all(dayModal.slots.map(cls =>
        markAttendance.mutateAsync({
          subject_id: cls.id,
          date,
          status: 'present',
          timetable_slot_id: cls.id,
          student_id: 'student-1',
        })
      ));
      dayModal.slots.forEach(cls => {
        setMarkedSlots(prev => ({ ...prev, [cls.id]: 'present' }));
      });
      toast.success(`Marked present for all ${dayModal.slots.length} class${dayModal.slots.length !== 1 ? 'es' : ''}`);
    } catch {
      toast.error('Failed to mark attendance. Please try again.');
    }
    setIsSubmitting(false);
  }, [dayModal, markAttendance]);

  // Confirm and execute "Absent All Day"
  const confirmAbsentAll = useCallback(async () => {
    if (!dayModal) return;
    setIsSubmitting(true);
    const date = dayModal.date;
    try {
      await Promise.all(dayModal.slots.map(cls =>
        markAttendance.mutateAsync({
          subject_id: cls.id,
          date,
          status: 'absent',
          timetable_slot_id: cls.id,
          student_id: 'student-1',
        })
      ));
      dayModal.slots.forEach(cls => {
        setMarkedSlots(prev => ({ ...prev, [cls.id]: 'absent' }));
      });
      toast.success(`Marked absent for all ${dayModal.slots.length} class${dayModal.slots.length !== 1 ? 'es' : ''}`);
      setShowAbsentWarning(false);
    } catch {
      toast.error('Failed to mark attendance. Please try again.');
    }
    setIsSubmitting(false);
  }, [dayModal, markAttendance]);

  // Confirm and execute Bunk selections
  const confirmBunk = useCallback(async () => {
    if (!dayModal) return;
    setIsSubmitting(true);
    const date = dayModal.date;
    try {
      await Promise.all(dayModal.slots.map(cls => {
        const isBunked = bunkSelections[cls.id] || false;
        const status = isBunked ? 'absent' : 'present';
        return markAttendance.mutateAsync({
          subject_id: cls.id,
          date,
          status,
          timetable_slot_id: cls.id,
          student_id: 'student-1',
        });
      }));
      dayModal.slots.forEach(cls => {
        const isBunked = bunkSelections[cls.id] || false;
        setMarkedSlots(prev => ({ ...prev, [cls.id]: isBunked ? 'absent' : 'present' }));
      });
      const bunkCount = dayModal.slots.filter(c => bunkSelections[c.id]).length;
      toast.success(`Marked ${bunkCount} class${bunkCount !== 1 ? 'es' : ''} as bunk, ${dayModal.slots.length - bunkCount} as present`);
      setShowBunkWarning(false);
      setBunkMode(false);
    } catch {
      toast.error('Failed to mark attendance. Please try again.');
    }
    setIsSubmitting(false);
  }, [dayModal, bunkSelections, markAttendance]);

  // Compute warning data for Absent All Day
  const absentWarning = useMemo(() => {
    if (!dayModal || !summary) return null;
    return calculateImpact(dayModal.slots.length, 0);
  }, [dayModal, summary, calculateImpact]);

  // Compute warning data for Bunk mode
  const bunkWarning = useMemo(() => {
    if (!dayModal || !summary) return null;
    const bunkCount = Object.values(bunkSelections).filter(Boolean).length;
    const presentCount = dayModal.slots.length - bunkCount;
    return calculateImpact(dayModal.slots.length, presentCount);
  }, [dayModal, bunkSelections, summary, calculateImpact]);

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
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Bunks</p>
          </div>
        </div>

        {/* Working Days Config */}
        <WorkingDaysConfig />

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
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
              const isNonWorkingDay = !workingDays.includes(dayOfWeek);
              const isHoliday = holidayDates.has(dateStr);
              const isDayOff = isNonWorkingDay || isHoliday;
              const daySlots = isDayOff ? [] : timetable.filter(s => s.day_of_week === dayOfWeek);

              if (isDayOff) {
                const holidayReason = holidays.find(h => h.date === dateStr)?.reason;
                return (
                  <div key={day}
                    className="p-1.5 border-b border-r border-stroke last:border-r-0 min-h-[60px] bg-stroke/[0.04]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted/40">{day}</span>
                      <span className="text-[7px] text-muted/30 font-medium bg-surface/30 px-1 py-0.5 rounded-full tracking-wider">H</span>
                    </div>
                    <div className="mt-2 flex items-center justify-center">
                      <span className="text-[8px] text-muted/30 italic text-center leading-tight">
                        {holidayReason || (isNonWorkingDay ? DAYS[dayOfWeek].slice(0, 3) : 'holiday')}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={day}
                  className={`p-1.5 border-b border-r border-stroke last:border-r-0 min-h-[60px] transition-colors ${daySlots.length > 0 ? 'cursor-pointer hover:bg-surface/30' : ''}`}
                  onClick={() => {
                    if (daySlots.length > 0) {
                      const date = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
                      openDayModal(day, date, daySlots);
                    }
                  }}
                >
                  <span className="text-[10px] text-muted">{day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {daySlots.slice(0, 2).map(cls => (
                      <div key={cls.id}
                        className="text-[8px] px-1 py-0.5 rounded-md truncate pointer-events-none"
                        style={{ background: (cls.color_tag || '#89AACC') + '20', color: cls.color_tag || '#89AACC' }}
                      >
                        {cls.subject_name?.slice(0, 8)}
                      </div>
                    ))}
                    {daySlots.length > 2 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex -space-x-0.5">
                          <div className="w-1.5 h-1.5 rounded-full border border-stroke" style={{ background: (daySlots[2].color_tag || '#89AACC') + '60' }} />
                          {daySlots.length > 3 && <div className="w-1.5 h-1.5 rounded-full border border-stroke" style={{ background: (daySlots[3].color_tag || '#89AACC') + '40' }} />}
                        </div>
                        <span className="text-[7px] text-[#4E85BF] font-medium">view all</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Schedule Modal - 3 action modes */}
      {dayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={closeDayModal}>
          <div className="glass-card-strong p-6 w-full max-w-md mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="mb-4 flex-shrink-0">
              <p className="text-lg font-display italic text-text-primary">
                {MONTHS[dayModal.month]} {dayModal.day}, {dayModal.year}
              </p>
              <p className="text-xs text-muted mt-1">{dayModal.slots.length} class{dayModal.slots.length !== 1 ? 'es' : ''} scheduled</p>
            </div>

            {/* Action Mode Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
              <button
                onClick={handleMarkAllPresent}
                disabled={isSubmitting}
                className="py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                style={{ borderColor: '#00C2A8', background: 'rgba(0,194,168,0.08)', color: '#00C2A8' }}
              >
                ✅ Mark All Present
              </button>
              <button
                onClick={() => { setBunkMode(false); setShowBunkWarning(false); setShowAbsentWarning(true); }}
                disabled={isSubmitting || showAbsentWarning}
                className="py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                style={{ borderColor: '#FF6B6B', background: showAbsentWarning ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.05)', color: '#FF6B6B' }}
              >
                ❌ Absent All Day
              </button>
              <button
                onClick={() => { setShowAbsentWarning(false); setShowBunkWarning(false); setBunkMode(prev => !prev); setBunkSelections({}); }}
                disabled={isSubmitting && !showBunkWarning}
                className="py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                style={{ borderColor: '#F5A623', background: bunkMode ? 'rgba(245,166,35,0.15)' : 'rgba(245,166,35,0.05)', color: '#F5A623' }}
              >
                🟡 Bunk
              </button>
            </div>

            {/* Absent All Day Warning */}
            {showAbsentWarning && absentWarning && (
              <div className="mb-4 p-4 rounded-2xl flex-shrink-0"
                style={{
                  background: absentWarning.isCritical
                    ? 'rgba(255,107,107,0.08)'
                    : 'rgba(245,166,35,0.08)',
                  border: '1px solid ' + (absentWarning.isCritical ? 'rgba(255,107,107,0.25)' : 'rgba(245,166,35,0.25)')
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: absentWarning.isCritical ? '#FF6B6B' : '#F5A623' }}>
                  ⚠️ Marking absent for all {dayModal.slots.length} classe{dayModal.slots.length !== 1 ? 's' : ''} on this day
                </p>
                <div className="text-xs space-y-1 text-muted">
                  <p>Current attendance: <span className="text-text-primary font-medium">{absentWarning.currentPct.toFixed(1)}%</span></p>
                  <p>Projected attendance: <span className="font-medium" style={{ color: absentWarning.isCritical ? '#FF6B6B' : '#F5A623' }}>{Math.max(0, absentWarning.newPct).toFixed(1)}%</span></p>
                  {absentWarning.z > 0 ? (
                    <p>You need <span className="text-text-primary font-medium">{absentWarning.z}</span> more present day{absentWarning.z !== 1 ? 's' : ''} to reach the {threshold}% threshold</p>
                  ) : (
                    <p style={{ color: '#00C2A8' }}>You'll still be above the {threshold}% threshold</p>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={confirmAbsentAll}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-bg transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: absentWarning.isCritical ? '#FF6B6B' : '#F5A623' }}
                  >
                    {isSubmitting ? 'Marking...' : 'Confirm — Mark Absent'}
                  </button>
                  <button onClick={() => setShowAbsentWarning(false)}
                    className="px-5 py-2.5 rounded-xl text-xs text-muted border border-stroke hover:text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Bunk Warning */}
            {showBunkWarning && bunkWarning && (
              <div className="mb-4 p-4 rounded-2xl flex-shrink-0"
                style={{
                  background: bunkWarning.isCritical
                    ? 'rgba(255,107,107,0.08)'
                    : 'rgba(245,166,35,0.08)',
                  border: '1px solid ' + (bunkWarning.isCritical ? 'rgba(255,107,107,0.25)' : 'rgba(245,166,35,0.25)')
                }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: bunkWarning.isCritical ? '#FF6B6B' : '#F5A623' }}>
                  ⚠️ Bunking {Object.values(bunkSelections).filter(Boolean).length} of {dayModal.slots.length} classe{dayModal.slots.length !== 1 ? 's' : ''}
                </p>
                <div className="text-xs space-y-1 text-muted">
                  <p>Current attendance: <span className="text-text-primary font-medium">{bunkWarning.currentPct.toFixed(1)}%</span></p>
                  <p>Projected attendance: <span className="font-medium" style={{ color: bunkWarning.isCritical ? '#FF6B6B' : '#F5A623' }}>{Math.max(0, bunkWarning.newPct).toFixed(1)}%</span></p>
                  {bunkWarning.z > 0 ? (
                    <p>You need <span className="text-text-primary font-medium">{bunkWarning.z}</span> more present day{bunkWarning.z !== 1 ? 's' : ''} to reach the {threshold}% threshold</p>
                  ) : (
                    <p style={{ color: '#00C2A8' }}>You'll still be above the {threshold}% threshold</p>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={confirmBunk}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-bg transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: bunkWarning.isCritical ? '#FF6B6B' : '#F5A623' }}
                  >
                    {isSubmitting ? 'Marking...' : 'Confirm — Mark Bunk'}
                  </button>
                  <button onClick={() => setShowBunkWarning(false)}
                    className="px-5 py-2.5 rounded-xl text-xs text-muted border border-stroke hover:text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Class List */}
            <div className="overflow-y-auto -mx-2 px-2 space-y-3 flex-1">
              {dayModal.slots.map(cls => {
                const isMarked = markedSlots[cls.id];
                const isChecked = bunkSelections[cls.id] || false;

                return (
                  <div key={cls.id} className={`rounded-2xl p-4 transition-all ${isMarked ? 'ring-1 ring-[#00C2A8]/50' : ''}`}
                    style={{ background: (cls.color_tag || '#89AACC') + '0a', border: '1px solid ' + (cls.color_tag || '#89AACC') + '18' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {bunkMode && !showAbsentWarning && !showBunkWarning ? (
                          <label
                            className="mt-0.5 flex items-center gap-2 cursor-pointer"
                            onClick={() => setBunkSelections(prev => ({ ...prev, [cls.id]: !prev[cls.id] }))}
                          >
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                              style={{
                                border: '2px solid ' + (isChecked ? '#F5A623' : 'hsl(var(--stroke))'),
                                background: isChecked ? 'rgba(245,166,35,0.2)' : 'transparent',
                              }}
                            >
                              {isChecked && <span className="text-xs" style={{ color: '#F5A623' }}>✓</span>}
                            </div>
                            <span className="text-[10px] font-medium" style={{ color: isChecked ? '#F5A623' : 'var(--muted)' }}>
                              Bunk
                            </span>
                          </label>
                        ) : null}
                        <div>
                          <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: (cls.color_tag || '#89AACC') + '18', color: cls.color_tag || '#89AACC' }}>
                            {cls.subject_name}
                          </div>
                          <p className="text-xs text-muted mt-1.5">
                            {cls.start_time} – {cls.end_time}
                            {cls.room ? ` · Room ${cls.room}` : ''}
                            {cls.professor ? ` · ${cls.professor}` : ''}
                          </p>
                        </div>
                      </div>
                      {isMarked && (
                        <span className="text-[10px] font-medium" style={{ color: isMarked === 'present' ? '#00C2A8' : isMarked === 'absent' ? '#FF6B6B' : '#F5A623' }}>
                          {isMarked === 'present' ? '✅' : isMarked === 'absent' ? '❌' : '🟡'} {isMarked}
                        </span>
                      )}
                    </div>

                    {/* Individual action buttons — hidden in bunk mode while selection is active */}
                    {!bunkMode && !showAbsentWarning && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 ${isMarked === 'present' ? 'opacity-90 ring-1 ring-[#00C2A8]' : ''}`}
                          style={{ borderColor: '#00C2A8', background: isMarked === 'present' ? 'rgba(0,194,168,0.15)' : 'rgba(0,194,168,0.05)', color: '#00C2A8' }}
                          onClick={() => handleMarkSlot(dayModal.day, cls, 'present', dayModal.date)}
                        >Present</button>
                        <button
                          className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 ${isMarked === 'absent' ? 'opacity-90 ring-1 ring-[#FF6B6B]' : ''}`}
                          style={{ borderColor: '#FF6B6B', background: isMarked === 'absent' ? 'rgba(255,107,107,0.15)' : 'rgba(255,107,107,0.05)', color: '#FF6B6B' }}
                          onClick={() => handleMarkSlot(dayModal.day, cls, 'absent', dayModal.date)}
                        >Absent</button>
                      </div>
                    )}

                    {/* In bunk mode with selection complete, show confirm action */}
                    {bunkMode && !showAbsentWarning && !showBunkWarning && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 ${!isChecked ? 'opacity-90 ring-1 ring-[#00C2A8]' : ''}`}
                          style={{ borderColor: '#00C2A8', background: !isChecked ? 'rgba(0,194,168,0.15)' : 'rgba(0,194,168,0.05)', color: '#00C2A8' }}
                          onClick={() => {
                            setBunkSelections(prev => ({ ...prev, [cls.id]: false }));
                            handleMarkSlot(dayModal.day, cls, 'present', dayModal.date);
                          }}
                        >Present</button>
                        <button
                          className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition-all hover:scale-[1.02] active:scale-95 ${isChecked ? 'opacity-90 ring-1 ring-[#F5A623]' : ''}`}
                          style={{ borderColor: '#F5A623', background: isChecked ? 'rgba(245,166,35,0.15)' : 'rgba(245,166,35,0.05)', color: '#F5A623' }}
                          onClick={() => setBunkSelections(prev => ({ ...prev, [cls.id]: !prev[cls.id] }))}
                        >
                          {isChecked ? '✓ Bunk' : 'Bunk'}
                        </button>
                      </div>
                    )}

                    {/* Show current status if already marked in blanket mode */}
                    {showAbsentWarning && !isMarked && (
                      <div className="text-center py-2">
                        <span className="text-[10px] text-muted italic">Will be marked absent</span>
                      </div>
                    )}
                    {showAbsentWarning && isMarked && (
                      <div className="text-center py-2">
                        <span className="text-[10px] font-medium" style={{ color: '#FF6B6B' }}>❌ Already marked absent</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bunk Mode: Confirm Bunk button (shows warning) */}
            {bunkMode && !showAbsentWarning && !showBunkWarning && (
              <button
                onClick={() => setShowBunkWarning(true)}
                disabled={isSubmitting}
                className="w-full mt-4 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-[1.01] active:scale-99 flex-shrink-0 disabled:opacity-40"
                style={{ background: 'rgba(245,166,35,0.12)', color: '#F5A623', border: '1px solid rgba(245,166,35,0.3)' }}
              >
                Confirm Bunk Selection
              </button>
            )}

            {/* Close button */}
            <button className="w-full mt-3 py-2.5 text-xs text-muted hover:text-text-primary transition-all rounded-xl border border-stroke flex-shrink-0"
              onClick={closeDayModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default AttendanceSection;
