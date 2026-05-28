import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useFocusSessions, useCreateFocusSession, useWeeklyReport } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const FOCUS_DEFAULT = 25;
const SHORT_BREAK = 5;
const LONG_BREAK = 15;

function FocusSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const timerRef = useRef(null);
  const timerRingRef = useRef(null);
  const reportRef = useRef(null);
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_DEFAULT * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [customTime, setCustomTime] = useState(25);
  const [activeSound, setActiveSound] = useState(null);

  const createSession = useCreateFocusSession();
  const { data: weeklyData = [] } = useWeeklyReport();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      if (timerRef.current) {
        gsap.fromTo(timerRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: timerRef.current, start: 'top 80%' } });
      }
      if (reportRef.current) {
        gsap.fromTo(reportRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: reportRef.current, start: 'top 85%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      const duration = mode === 'focus' ? FOCUS_DEFAULT : mode === 'shortBreak' ? SHORT_BREAK : mode === 'longBreak' ? LONG_BREAK : customTime;
      createSession.mutate({
        start_time: new Date(Date.now() - duration * 60 * 1000).toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: duration,
        session_type: mode === 'focus' ? 'focus' : 'break',
        date: new Date().toISOString().split('T')[0],
      });
      if (mode === 'focus') setSessionCount(prev => prev + 1);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalSeconds = (mode === 'focus' ? FOCUS_DEFAULT : mode === 'shortBreak' ? SHORT_BREAK : mode === 'longBreak' ? LONG_BREAK : customTime) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;
  const offset = circumference - (progress / 100) * circumference;

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    const mins = mode === 'focus' ? FOCUS_DEFAULT : mode === 'shortBreak' ? SHORT_BREAK : mode === 'longBreak' ? LONG_BREAK : customTime;
    setTimeLeft(mins * 60);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    const mins = newMode === 'focus' ? FOCUS_DEFAULT : newMode === 'shortBreak' ? SHORT_BREAK : newMode === 'longBreak' ? LONG_BREAK : customTime;
    setTimeLeft(mins * 60);
  };

  const ambientSounds = [
    { id: 'rain', label: 'Rain', icon: '🌧️' },
    { id: 'cafe', label: 'Cafe', icon: '☕' },
    { id: 'whitenoise', label: 'White Noise', icon: '🌊' },
    { id: 'lofi', label: 'Lo-fi', icon: '🎵' },
  ];

  // Weekly report data
  const weeklyChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      name: d.toLocaleDateString('en', { weekday: 'short' }),
      minutes: Math.floor(Math.random() * 120 + 20),
    };
  });

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36 bg-gradient-to-b from-cream via-soft-lavender/20 to-cream">
      <div className="section-container">
        <div ref={titleRef} className="mb-12 text-center">
          <h2 className="section-title">Enter Deep Work</h2>
          <p className="section-subtitle mt-4">Your focus zone. Distraction-free.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Timer */}
          <div ref={timerRef} className="flex flex-col items-center">
            {/* Mode selector */}
            <div className="flex gap-2 mb-8">
              {[
                { id: 'focus', label: 'Focus', color: '#3B1FA8' },
                { id: 'shortBreak', label: 'Short Break', color: '#00C2A8' },
                { id: 'longBreak', label: 'Long Break', color: '#F5A623' },
              ].map(m => (
                <button key={m.id} onClick={() => handleModeChange(m.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    mode === m.id ? 'text-white shadow-lg' : 'bg-white/50 text-indigo-400 hover:bg-white'
                  }`}
                  style={mode === m.id ? { background: m.color } : {}}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Circular timer */}
            <div className="relative mb-6" style={{ width: 280, height: 280 }}>
              <svg width="280" height="280" viewBox="0 0 280 280">
                <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(59,31,168,0.06)" strokeWidth="8" />
                <circle ref={timerRingRef} cx="140" cy="140" r="120" fill="none" stroke="#3B1FA8" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                  transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-5xl font-mono font-bold tracking-tight" style={{ color: '#1a1a2e' }}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
                <p className="text-xs text-indigo-400/40 mt-1 capitalize">{mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Focus'}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mb-6">
              {!isRunning ? (
                <button onClick={handleStart} className="w-14 h-14 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #3B1FA8, #6B3FFF)' }}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </button>
              ) : (
                <button onClick={handlePause} className="w-14 h-14 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #F5A623, #FF6B6B)' }}>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
              )}
              <button onClick={handleReset} className="w-14 h-14 rounded-full bg-white/50 text-indigo-400 flex items-center justify-center transition-all duration-300 hover:bg-white hover:shadow-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>

            {/* Session count */}
            <p className="text-sm text-indigo-400/40">Today's sessions: <span className="font-semibold text-indigo-500">{sessionCount}</span></p>

            {/* Ambient sounds */}
            <div className="flex gap-2 mt-6">
              {ambientSounds.map(s => (
                <button key={s.id} onClick={() => setActiveSound(activeSound === s.id ? null : s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                    activeSound === s.id ? 'bg-indigo-100 text-indigo-600 shadow-sm' : 'bg-white/50 text-indigo-400 hover:bg-white'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports */}
          <div ref={reportRef} className="space-y-6">
            {/* Weekly bar chart */}
            <div className="glass-card p-6">
              <h4 className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>This Week's Focus</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,31,168,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(59,31,168,0.4)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'rgba(59,31,168,0.4)' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(59,31,168,0.1)', background: 'rgba(255,255,255,0.9)' }} />
                  <Bar dataKey="minutes" fill="#3B1FA8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'This Week', value: `${Math.floor(Math.random() * 600 + 100)} min`, sub: `${(Math.random() * 5 + 2).toFixed(1)} hrs` },
                { label: 'This Month', value: `${Math.floor(Math.random() * 2000 + 500)} min`, sub: `${(Math.random() * 20 + 8).toFixed(1)} hrs` },
                { label: 'Best Day', value: `${Math.floor(Math.random() * 120 + 60)} min`, sub: `${(Math.random() * 2 + 1).toFixed(1)} hrs` },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 text-center hover-lift">
                  <p className="text-[10px] text-indigo-400/40 mb-1">{s.label}</p>
                  <p className="text-lg font-mono font-bold" style={{ color: '#1a1a2e' }}>{s.value}</p>
                  <p className="text-[10px] text-indigo-400/30">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FocusSection;
