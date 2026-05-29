import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, CartesianGrid,
} from 'recharts';
import { useFocusSessions, useCreateFocusSession, useWeeklyReport, useMonthlyReport, useYearlyReport, useProfile } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const STORAGE_KEY = 'focus-timer-settings';

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return { minutes: 25, hours: 0, breakMinutes: 5 };
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function FocusSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Timer state ──
  const [timerState, setTimerState] = useState('idle'); // idle | running | paused | completed
  const [timeRemaining, setTimeRemaining] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);

  // ── Customize state ──
  const [showCustomize, setShowCustomize] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);

  // ── Reports state ──
  const [showReports, setShowReports] = useState(false);
  const [reportTab, setReportTab] = useState('Daily');
  const [yearTooltip, setYearTooltip] = useState(null);

  // ── Hooks ──
  const { data: sessions = [] } = useFocusSessions();
  const createSession = useCreateFocusSession();
  const { data: weeklyReport = [] } = useWeeklyReport();
  const { data: monthlyReport = [] } = useMonthlyReport();
  const { data: yearlyReport = [] } = useYearlyReport();
  const { data: profile } = useProfile();

  const focusGoal = profile?.focus_goal || 4; // hours per day

  // ── Load settings ──
  useEffect(() => {
    const settings = loadSettings();
    const totalMins = settings.minutes + (settings.hours || 0) * 60;
    setTimeRemaining(totalMins * 60);
    setTotalTime(totalMins * 60);
    setCustomMinutes(settings.minutes);
    setCustomHours(settings.hours || 0);
    setCustomBreak(settings.breakMinutes || 5);
  }, []);

  // ── Timer interval ──
  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            const duration = Math.round(totalTime / 60);
            createSession.mutate({
              start_time: new Date(Date.now() - duration * 60000).toISOString(),
              end_time: new Date().toISOString(),
              duration_minutes: duration,
              session_type: isBreak ? 'break' : 'focus',
              date: todayStr(),
            });
            setTimerState('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState, totalTime, isBreak, createSession]);

  // ── GSAP animation ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      if (timerRef.current) {
        gsap.fromTo(timerRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: timerRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ── Timer actions ──
  const startTimer = useCallback(() => {
    if (timerState === 'idle' || timerState === 'completed') {
      const settings = loadSettings();
      const totalMins = settings.minutes + (settings.hours || 0) * 60;
      setTotalTime(totalMins * 60);
      setTimeRemaining(totalMins * 60);
      setIsBreak(false);
    }
    setTimerState('running');
  }, [timerState]);

  const pauseTimer = useCallback(() => setTimerState('paused'), []);
  const resumeTimer = useCallback(() => setTimerState('running'), []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const settings = loadSettings();
    const totalMins = settings.minutes + (settings.hours || 0) * 60;
    setTimeRemaining(totalMins * 60);
    setTotalTime(totalMins * 60);
    setTimerState('idle');
    setIsBreak(false);
  }, []);

  const applyCustom = useCallback(() => {
    const mins = customMinutes + customHours * 60;
    if (mins < 1) return;
    setTimeRemaining(mins * 60);
    setTotalTime(mins * 60);
    setTimerState('idle');
    setIsBreak(false);
    saveSettings({ minutes: customMinutes, hours: customHours, breakMinutes: customBreak });
    setShowCustomize(false);
  }, [customMinutes, customHours, customBreak]);

  // ── Circular progress ──
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalTime > 0 ? timeRemaining / totalTime : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // ── Today's focus sessions ──
  const todaySessions = useMemo(() => {
    const today = todayStr();
    return sessions.filter(s => s.date === today && s.session_type === 'focus');
  }, [sessions]);

  const todayTotalMinutes = useMemo(() =>
    todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
  [todaySessions]);

  // ── Daily tab data (today's sessions as horizontal bars) ──
  const dailyChartData = useMemo(() => {
    const today = todayStr();
    return sessions
      .filter(s => s.date === today)
      .map(s => {
        const startTime = s.start_time ? new Date(s.start_time) : new Date();
        const label = startTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
        return {
          label,
          duration: s.duration_minutes || 0,
          type: s.session_type || 'focus',
          id: s.id,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [sessions]);

  // ── Weekly tab data ──
  const weeklyChartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en', { weekday: 'short' });
      const totalMins = weeklyReport
        .filter(s => s.date === dateStr && s.session_type === 'focus')
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      days.push({ day: dayName, date: dateStr, focusMinutes: totalMins });
    }
    return days;
  }, [weeklyReport]);

  // ── Monthly tab data (cumulative focus hours per week) ──
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const weeks = [];
    let cumulative = 0;

    // Group by ISO week
    const weekMap = {};
    monthlyReport.forEach(s => {
      if (s.session_type !== 'focus') return;
      const d = new Date(s.date);
      if (d < monthStart || d > monthEnd) return;
      const wk = getWeekNumber(d);
      if (!weekMap[wk]) weekMap[wk] = 0;
      weekMap[wk] += (s.duration_minutes || 0) / 60;
    });

    Object.keys(weekMap).sort((a, b) => a - b).forEach(wk => {
      cumulative += weekMap[wk];
      weeks.push({ week: `W${wk}`, hours: Math.round(weekMap[wk] * 10) / 10, cumulative: Math.round(cumulative * 10) / 10 });
    });

    return weeks;
  }, [monthlyReport]);

  // ── Yearly heatmap data ──
  const yearlyHeatmap = useMemo(() => {
    // Build day->minutes map from yearly report
    const dayMinutes = {};
    yearlyReport.forEach(s => {
      if (s.session_type !== 'focus') return;
      dayMinutes[s.date] = (dayMinutes[s.date] || 0) + (s.duration_minutes || 0);
    });

    // Build 52-week grid
    const now = new Date();
    // Go back to start of the week (Sunday)
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - end.getDay());

    const start = new Date(end);
    start.setDate(start.getDate() - 364); // 52 weeks * 7 days
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    const weeks = [];
    const current = new Date(start);
    while (current <= end) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().split('T')[0];
        week.push({
          date: dateStr,
          dayOfWeek: current.getDay(),
          minutes: dayMinutes[dateStr] || 0,
          isToday: dateStr === todayStr(),
        });
        current.setDate(current.getDate() + 1);
        if (current > end) break;
      }
      weeks.push(week);
    }
    return weeks;
  }, [yearlyReport]);

  // Max minutes for color intensity
  const maxYearlyMinutes = useMemo(() => {
    let max = 0;
    yearlyHeatmap.forEach(week => week.forEach(cell => { if (cell.minutes > max) max = cell.minutes; }));
    return max || 1;
  }, [yearlyHeatmap]);

  // ── Total stats ──
  const totalMinutes = useMemo(() =>
    sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
  [sessions]);

  // ── Render ──
  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        {/* Header */}
        <div ref={titleRef} className="flex items-start justify-between mb-10">
          <div>
            <p className="section-eyebrow">Productivity</p>
            <h2 className="section-heading">Focus *sessions*</h2>
            <p className="section-subtext">Deep work, timed and tracked.</p>
          </div>
          <button
            onClick={() => { setShowReports(r => !r); if (showReports === false) setReportTab('Daily'); }}
            className="px-5 py-2.5 rounded-xl text-xs font-medium border border-stroke text-muted hover:text-text-primary hover:border-text-primary/30 transition-all whitespace-nowrap"
          >
            {showReports ? 'Hide Reports' : 'View Reports'}
          </button>
        </div>

        {/* ── Timer + Daily Summary Row ── */}
        <div ref={timerRef} className="flex flex-col lg:flex-row gap-8 items-center mb-10">
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className="relative w-[180px] h-[180px] flex items-center justify-center">
              {/* Background ring */}
              <svg width="180" height="180" className="absolute" viewBox="0 0 180 180">
                <circle
                  cx="90" cy="90" r={radius}
                  fill="none"
                  stroke="hsl(var(--stroke))"
                  strokeWidth="6"
                />
                {/* Progress ring */}
                <circle
                  cx="90" cy="90" r={radius}
                  fill="none"
                  stroke={isBreak ? '#F5A623' : '#89AACC'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 90 90)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
                />
              </svg>
              {/* Time display */}
              <div className="text-center z-10">
                <p className="text-3xl font-mono font-medium text-text-primary tracking-wider">
                  {formatTime(timeRemaining)}
                </p>
                <p className="text-[10px] text-muted uppercase tracking-wider mt-1">
                  {isBreak ? 'Break' : 'Focus'}
                </p>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex items-center gap-3 mt-5">
              {timerState === 'idle' || timerState === 'completed' ? (
                <button onClick={startTimer}
                  className="px-8 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #89AACC, #4E85BF)', color: '#000' }}
                >
                  Start
                </button>
              ) : timerState === 'running' ? (
                <button onClick={pauseTimer}
                  className="px-8 py-2.5 rounded-full text-sm font-medium border border-stroke text-muted hover:text-text-primary transition-all hover:scale-105"
                >
                  Pause
                </button>
              ) : (
                <button onClick={resumeTimer}
                  className="px-8 py-2.5 rounded-full text-sm font-medium border border-stroke text-muted hover:text-text-primary transition-all hover:scale-105"
                >
                  Resume
                </button>
              )}
              {(timerState === 'paused' || timerState === 'completed') && (
                <button onClick={resetTimer}
                  className="px-5 py-2.5 rounded-full text-xs font-medium text-muted hover:text-text-primary transition-all"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Customize */}
            {!showCustomize ? (
              <button onClick={() => setShowCustomize(true)}
                className="text-xs text-muted hover:text-text-primary transition-all mt-3 underline underline-offset-2 decoration-stroke"
              >
                Customize
              </button>
            ) : (
              <div className="mt-4 p-4 glass-card">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <label className="text-[9px] text-muted uppercase tracking-wider block mb-1">Hours</label>
                    <input type="number" min={0} max={4} value={customHours}
                      onChange={e => setCustomHours(Math.min(4, Math.max(0, Number(e.target.value))))}
                      className="w-16 px-2 py-1.5 rounded-lg text-xs bg-surface border border-stroke text-text-primary text-center focus:outline-none focus:border-text-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted uppercase tracking-wider block mb-1">Minutes</label>
                    <input type="number" min={1} max={120} value={customMinutes}
                      onChange={e => setCustomMinutes(Math.min(120, Math.max(1, Number(e.target.value))))}
                      className="w-16 px-2 py-1.5 rounded-lg text-xs bg-surface border border-stroke text-text-primary text-center focus:outline-none focus:border-text-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-muted uppercase tracking-wider block mb-1">Break (min)</label>
                    <input type="number" min={1} max={60} value={customBreak}
                      onChange={e => setCustomBreak(Math.min(60, Math.max(1, Number(e.target.value))))}
                      className="w-16 px-2 py-1.5 rounded-lg text-xs bg-surface border border-stroke text-text-primary text-center focus:outline-none focus:border-text-primary/30"
                    />
                  </div>
                  <button onClick={applyCustom}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'linear-gradient(135deg, #89AACC, #4E85BF)', color: '#000' }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Daily Summary */}
          <div className="flex-1 w-full">
            <div className="glass-card p-5">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-3">Today</p>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-2xl font-display italic text-text-primary">{formatDuration(todayTotalMinutes)}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Total focus time</p>
                </div>
                <div className="w-px h-10 bg-stroke" />
                <div>
                  <p className="text-2xl font-display italic text-text-primary">{todaySessions.length}</p>
                  <p className="text-[9px] text-muted uppercase tracking-wider mt-0.5">Sessions done</p>
                </div>
                <div className="w-px h-10 bg-stroke" />
                {/* Sparkline */}
                <div className="flex-1 min-w-[120px]">
                  <p className="text-[9px] text-muted uppercase tracking-wider mb-2">Durations</p>
                  <div className="flex items-end gap-[3px] h-8">
                    {todaySessions.length > 0 ? (
                      todaySessions.slice(-20).map((s, i) => {
                        const maxDur = Math.max(...todaySessions.map(x => x.duration_minutes || 1), 1);
                        const h = ((s.duration_minutes || 0) / maxDur) * 100;
                        return (
                          <div key={s.id || i}
                            className="flex-1 rounded-t-sm transition-all hover:opacity-80"
                            style={{
                              height: `${Math.max(h, 8)}%`,
                              background: s.session_type === 'break' ? '#F5A623' : '#89AACC',
                              opacity: s.session_type === 'break' ? 0.6 : 1,
                            }}
                            title={`${s.duration_minutes}m`}
                          />
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-[9px] text-muted/50">No sessions yet today</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-display italic text-text-primary">{sessions.length}</p>
                <p className="text-xs text-muted mt-1 uppercase tracking-wider">Total Sessions</p>
              </div>
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-display italic text-text-primary">{totalMinutes}</p>
                <p className="text-xs text-muted mt-1 uppercase tracking-wider">Total Minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ REPORTS PANEL ════════ */}
        {showReports && (
          <div className="mb-10 glass-card overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-stroke overflow-x-auto">
              {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(tab => (
                <button key={tab}
                  onClick={() => setReportTab(tab)}
                  className={`px-6 py-3.5 text-xs font-medium transition-all relative whitespace-nowrap ${
                    reportTab === tab ? 'text-text-primary' : 'text-muted hover:text-text-primary'
                  }`}
                >
                  {tab}
                  {reportTab === tab && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full" style={{ background: '#89AACC' }} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── DAILY TAB ── */}
              {reportTab === 'Daily' && (
                <div>
                  <p className="text-xs text-muted mb-4">Today's sessions — bar length = duration</p>
                  {dailyChartData.length > 0 ? (
                    <div className="w-full" style={{ height: Math.max(200, dailyChartData.length * 50) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyChartData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                          <XAxis
                            type="number"
                            tick={{ fill: 'hsl(var(--muted))', fontSize: 10 }}
                            axisLine={{ stroke: 'hsl(var(--stroke))' }}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="label"
                            tick={{ fill: 'hsl(var(--muted))', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={50}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--surface))',
                              border: '1px solid hsl(var(--stroke))',
                              borderRadius: '12px',
                              fontSize: '12px',
                              color: 'hsl(var(--text))',
                            }}
                            formatter={(value, name, props) => [`${value} min`, props.payload.type === 'focus' ? 'Focus' : 'Break']}
                          />
                          <Bar dataKey="duration" radius={[0, 4, 4, 0]} maxBarSize={20}>
                            {dailyChartData.map(entry => (
                              <Cell key={entry.id} fill={entry.type === 'break' ? '#F5A623' : '#4E85BF'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">No sessions yet today. Start a focus session to see your daily chart.</p>
                  )}
                </div>
              )}

              {/* ── WEEKLY TAB ── */}
              {reportTab === 'Weekly' && (
                <div>
                  <p className="text-xs text-muted mb-4">Past 7 days — total focus minutes per day</p>
                  {weeklyChartData.length > 0 && weeklyChartData.some(d => d.focusMinutes > 0) ? (
                    <div className="w-full" style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyChartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="hsl(var(--stroke))" strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="day"
                            tick={{ fill: 'hsl(var(--muted))', fontSize: 10 }}
                            axisLine={{ stroke: 'hsl(var(--stroke))' }}
                            tickLine={false}
                          />
                          <YAxis
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
                              color: 'hsl(var(--text))',
                            }}
                            formatter={(value) => [`${value} min`, 'Focus']}
                          />
                          {/* Reference line for daily goal */}
                          <ReferenceLine
                            y={focusGoal * 60}
                            stroke="#F5A623"
                            strokeDasharray="5 5"
                            strokeWidth={1.5}
                            label={{
                              value: `Goal: ${focusGoal}h`,
                              position: 'top',
                              fill: '#F5A623',
                              fontSize: 10,
                            }}
                          />
                          <Bar dataKey="focusMinutes" fill="#4E85BF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">No focus sessions this week. Start focusing to see your weekly progress.</p>
                  )}
                </div>
              )}

              {/* ── MONTHLY TAB ── */}
              {reportTab === 'Monthly' && (
                <div>
                  <p className="text-xs text-muted mb-4">This month — cumulative focus hours per week</p>
                  {monthlyChartData.length > 0 ? (
                    <div className="w-full" style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#89AACC" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#89AACC" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="hsl(var(--stroke))" strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="week"
                            tick={{ fill: 'hsl(var(--muted))', fontSize: 10 }}
                            axisLine={{ stroke: 'hsl(var(--stroke))' }}
                            tickLine={false}
                          />
                          <YAxis
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
                              color: 'hsl(var(--text))',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulative"
                            stroke="#89AACC"
                            strokeWidth={2}
                            fill="url(#focusGradient)"
                            name="Cumulative Hours"
                          />
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="#4E85BF"
                            strokeWidth={2}
                            fill="none"
                            strokeDasharray="4 4"
                            name="Weekly Hours"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">No focus sessions this month. Start focusing to see your monthly trend.</p>
                  )}
                </div>
              )}

              {/* ── YEARLY TAB ── */}
              {reportTab === 'Yearly' && (
                <div>
                  <p className="text-xs text-muted mb-4">Past 365 days — focus minutes per day</p>
                  {yearlyHeatmap.length > 0 && maxYearlyMinutes > 0 ? (
                    <div className="overflow-x-auto pb-2">
                      <div className="inline-flex flex-col gap-[2px]" style={{ minWidth: Math.max(yearlyHeatmap.length * 13, 300) }}>
                        {/* Day labels */}
                        <div className="flex gap-[2px]">
                          <div className="w-8" />
                          {yearlyHeatmap.map((week, wi) => {
                            // Show month label on first week of each month
                            const firstCell = week[0];
                            if (!firstCell) return <div key={wi} className="w-[10px]" />;
                            const month = new Date(firstCell.date).getMonth();
                            const prevWeek = wi > 0 ? yearlyHeatmap[wi - 1][0] : null;
                            const prevMonth = prevWeek ? new Date(prevWeek.date).getMonth() : -1;
                            return (
                              <div key={wi} className="w-[10px] text-[6px] text-muted text-center" style={{ visibility: month !== prevMonth ? 'visible' : 'hidden' }}>
                                {MONTHS_SHORT[month]}
                              </div>
                            );
                          })}
                        </div>
                        {/* Grid rows (Sun-Sat) */}
                        {[0, 1, 2, 3, 4, 5, 6].map(dow => (
                          <div key={dow} className="flex gap-[2px] items-center">
                            <span className="w-8 text-[8px] text-muted text-right pr-1">
                              {dow === 0 ? 'Sun' : dow === 1 ? 'Mon' : dow === 3 ? 'Wed' : dow === 5 ? 'Fri' : ''}
                            </span>
                            {yearlyHeatmap.map((week, wi) => {
                              const cell = week.find(c => c.dayOfWeek === dow);
                              if (!cell) return <div key={wi} className="w-[10px] h-[10px]" />;
                              // Intensity: 4 levels
                              const ratio = maxYearlyMinutes > 0 ? cell.minutes / maxYearlyMinutes : 0;
                              let opacity = 0;
                              if (cell.minutes > 0) {
                                if (ratio > 0.66) opacity = 1;
                                else if (ratio > 0.33) opacity = 0.6;
                                else opacity = 0.3;
                              }
                              return (
                                <div
                                  key={cell.date}
                                  className="w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-all duration-150 hover:scale-150 hover:z-10 relative"
                                  style={{
                                    background: cell.minutes > 0 ? '#89AACC' : 'hsl(var(--stroke))',
                                    opacity: cell.minutes > 0 ? opacity : 0.15,
                                    border: cell.isToday ? '1px solid hsl(var(--text))' : 'none',
                                  }}
                                  onMouseEnter={e => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setYearTooltip({
                                      x: rect.left + rect.width / 2,
                                      y: rect.top - 8,
                                      date: cell.date,
                                      minutes: cell.minutes,
                                    });
                                  }}
                                  onMouseLeave={() => setYearTooltip(null)}
                                />
                              );
                            })}
                          </div>
                        ))}
                        {/* Legend */}
                        <div className="flex items-center gap-2 mt-3 ml-8">
                          <span className="text-[9px] text-muted">Less</span>
                          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: 'hsl(var(--stroke))', opacity: 0.15 }} />
                          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: '#89AACC', opacity: 0.3 }} />
                          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: '#89AACC', opacity: 0.6 }} />
                          <div className="w-[10px] h-[10px] rounded-[2px]" style={{ background: '#89AACC', opacity: 1 }} />
                          <span className="text-[9px] text-muted">More</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted/50 text-center py-10">Not enough data yet. Keep focusing to build your yearly heatmap.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ SESSION HISTORY ════════ */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-stroke">
            <p className="text-xs text-muted uppercase tracking-wider">Recent Sessions</p>
          </div>
          {sessions.slice(-10).reverse().map(session => (
            <div key={session.id} className="flex items-center justify-between p-4 border-b border-stroke last:border-b-0 hover:bg-surface/30 transition-colors">
              <div>
                <p className="text-sm text-text-primary">{session.session_type === 'focus' ? '🎯 Focus' : '☕ Break'}</p>
                <p className="text-[10px] text-muted mt-0.5">{session.date}</p>
              </div>
              <span className="text-xs text-muted">{session.duration_minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly tooltip */}
      {yearTooltip && (
        <div
          className="fixed z-[100] pointer-events-none transition-opacity duration-150"
          style={{ left: yearTooltip.x, top: yearTooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="glass-card-strong px-3 py-2 text-xs whitespace-nowrap">
            <p className="text-text-primary font-medium">{yearTooltip.date}</p>
            <p className="text-muted mt-0.5">
              {yearTooltip.minutes > 0 ? `${yearTooltip.minutes} min focused` : 'No focus'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default FocusSection;
