import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useProfile, useUploadPhoto } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function HeroSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const photoRef = useRef(null);
  const stripRef = useRef(null);
  const orbitRef = useRef(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef(null);

  const { data: profile, isLoading } = useProfile();
  const uploadPhoto = useUploadPhoto();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const dayName = DAYS[now.getDay()];
  const dateStr = `${dayName}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Time-aware background tint
  const isMorning = hour >= 6 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 17;
  const isEvening = hour >= 17 || hour < 6;
  const bgTint = isMorning
    ? 'rgba(245, 166, 35, 0.03)'
    : isAfternoon
      ? 'rgba(255, 255, 255, 0)'
      : 'rgba(245, 166, 35, 0.04)';

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Split text animation for greeting
      const greetingText = titleRef.current;
      if (greetingText) {
        const words = greetingText.textContent.split(' ');
        greetingText.innerHTML = words
          .map(w => `<span class="greeting-word" style="display:inline-block; opacity:0; transform:translateY(30px)">${w}</span>`)
          .join(' ');
        gsap.to('.greeting-word', {
          y: 0,
          opacity: 1,
          stagger: 0.05,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.5,
        });
      }

      // Photo entrance
      if (photoRef.current) {
        gsap.fromTo(photoRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.8 }
        );
      }

      // Orbit rotation
      if (orbitRef.current) {
        gsap.to(orbitRef.current, {
          rotation: 360,
          duration: 20,
          repeat: -1,
          ease: 'none',
        });
      }

      // Strip entrance
      if (stripRef.current) {
        gsap.fromTo(stripRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.2 }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Floating shapes
  useEffect(() => {
    const handleMouseMove = (e) => {
      const shapes = document.querySelectorAll('.float-shape');
      shapes.forEach((shape) => {
        const speed = parseFloat(shape.dataset.speed || 0.02);
        const x = (e.clientX * speed);
        const y = (e.clientY * speed);
        shape.style.transform = `translate(${x}px, ${y}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <section ref={sectionRef} className="min-h-screen flex items-center justify-center">
        <div className="skeleton w-24 h-24 rounded-full" />
      </section>
    );
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  const photoUrl = profile?.profile_photo_url;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${bgTint} 0%, #FFFDF8 100%)` }}
    >
      {/* Floating shapes */}
      <div className="float-shape absolute top-20 left-10 w-64 h-64 rounded-full bg-indigo-50/40 blur-3xl" data-speed="0.02" />
      <div className="float-shape absolute bottom-20 right-20 w-80 h-80 rounded-full bg-gold/10 blur-3xl" data-speed="0.015" />
      <div className="float-shape absolute top-1/3 right-1/3 w-48 h-48 rounded-full bg-mint/10 blur-3xl" data-speed="0.025" />

      <div className="section-container w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0 min-h-[80vh]">
          {/* Left side - text content */}
          <div className="flex-1 lg:pr-16">
            <div className="mb-6 lg:mb-8">
              <p className="text-sm lg:text-base font-medium text-indigo-500/60 tracking-widest uppercase mb-2">
                Student OS v1.0
              </p>
              <h1
                ref={titleRef}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight"
                style={{ color: '#1a1a2e' }}
              >
                {greeting}, {profile?.name || 'Student'} ☀️
              </h1>
            </div>

            <p className="text-xl lg:text-2xl font-body font-light text-indigo-500/60 mb-8 lg:mb-12">
              {dateStr}
            </p>

            {/* Today at a Glance strip */}
            <div ref={stripRef} className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
              <div className="glass-card p-4 lg:p-5 hover-lift">
                <p className="text-xs font-medium text-indigo-400/60 uppercase tracking-wider mb-1">Next Class</p>
                <p className="text-sm lg:text-base font-semibold" style={{ color: '#1a1a2e' }}>Data Structures</p>
                <p className="text-xs text-indigo-500/40">10:30 AM · Room 301</p>
              </div>
              <div className="glass-card p-4 lg:p-5 hover-lift">
                <p className="text-xs font-medium text-indigo-400/60 uppercase tracking-wider mb-1">Habit Streak</p>
                <p className="text-2xl lg:text-3xl font-mono font-bold text-gradient">7</p>
                <p className="text-xs text-indigo-500/40">days 🔥</p>
              </div>
              <div className="glass-card p-4 lg:p-5 hover-lift">
                <p className="text-xs font-medium text-indigo-400/60 uppercase tracking-wider mb-1">Focus Today</p>
                <p className="text-2xl lg:text-3xl font-mono font-bold" style={{ color: '#00C2A8' }}>2/4</p>
                <p className="text-xs text-indigo-500/40">pomodoros</p>
              </div>
              <div className="glass-card p-4 lg:p-5 hover-lift">
                <p className="text-xs font-medium text-indigo-400/60 uppercase tracking-wider mb-1">CGPA</p>
                <p className="text-2xl lg:text-3xl font-mono font-bold" style={{ color: '#3B1FA8' }}>3.72</p>
                <p className="text-xs text-indigo-500/40">cumulative</p>
              </div>
            </div>
          </div>

          {/* Right side - profile photo with breathing room */}
          <div className="lg:w-[400px] flex-shrink-0 flex flex-col items-center justify-center py-16 lg:py-20">
            <div className="relative" style={{ width: 300, height: 300 }}>
              {/* Outer decorative rings */}
              <div
                ref={orbitRef}
                className="absolute inset-0 flex items-center justify-center"
                style={{ width: 450, height: 450, top: -75, left: -75 }}
              >
                <svg width="450" height="450" viewBox="0 0 450 450" fill="none" className="absolute">
                  <circle cx="225" cy="225" r="220" stroke="rgba(59, 31, 168, 0.06)" strokeWidth="1" fill="none" />
                  <circle cx="225" cy="225" r="200" stroke="rgba(245, 166, 35, 0.12)" strokeWidth="0.5" fill="none" strokeDasharray="8 6" />
                </svg>
              </div>

              {/* Photo circle */}
              <div
                ref={photoRef}
                className="relative w-full h-full rounded-full overflow-hidden cursor-pointer group"
                style={{
                  boxShadow: '0 8px 40px rgba(245, 166, 35, 0.15), 0 2px 12px rgba(59, 31, 168, 0.08)',
                }}
                onMouseEnter={() => setShowUpload(true)}
                onMouseLeave={() => setShowUpload(false)}
                onClick={handlePhotoClick}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={profile?.name || 'Student'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #FEFCF3 0%, #FFF8E1 100%)',
                    }}
                  >
                    <span className="text-5xl lg:text-6xl font-display font-bold" style={{ color: 'rgba(59, 31, 168, 0.4)' }}>
                      {initials}
                    </span>
                  </div>
                )}

                {/* Upload overlay */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm transition-all duration-300 ${
                    showUpload ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <svg className="w-8 h-8 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-medium text-white">Update Photo</span>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
