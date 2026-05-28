import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useFocusSessions, useCreateFocusSession } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function FocusSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  const { data: sessions = [] } = useFocusSessions();
  const createSession = useCreateFocusSession();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const startFocus = () => {
    createSession.mutate({
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 25 * 60000).toISOString(),
      duration_minutes: 25,
      session_type: 'focus',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="mb-10">
          <p className="section-eyebrow">Productivity</p>
          <h2 className="section-heading">Focus *sessions*</h2>
          <p className="section-subtext">Deep work, timed and tracked.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-display italic text-text-primary">{sessions.length}</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">Sessions</p>
          </div>
          <div className="glass-card p-6 text-center">
            <p className="text-3xl font-display italic text-text-primary">{totalMinutes}</p>
            <p className="text-xs text-muted mt-1 uppercase tracking-wider">Total Minutes</p>
          </div>
          <div className="glass-card p-6 text-center flex items-center justify-center">
            <button onClick={startFocus} disabled={createSession.isPending}
              className="btn-primary text-xs px-6 py-3 disabled:opacity-40">
              {createSession.isPending ? 'Starting...' : '🎯 Start 25min Focus'}
            </button>
          </div>
        </div>

        {/* History */}
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
    </section>
  );
}

export default FocusSection;
