import React, { useEffect, useRef, useState } from 'react';

const navLinks = [
  { id: 'hero', label: 'Home' },
  { id: 'timetable', label: 'Schedule' },
  { id: 'notes', label: 'Notes' },
  { id: 'habits', label: 'Habits' },
  { id: 'aichat', label: 'AI' },
  { id: 'profile', label: 'Profile' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);

      // Detect active section
      const sections = navLinks.map(l => document.getElementById(`section-${l.id}`));
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(navLinks[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
        <div
          className={`inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface px-2 py-2 transition-all duration-300 ${
            scrolled ? 'shadow-md shadow-black/10' : ''
          }`}
        >
          {/* Logo */}
          <button
            onClick={() => scrollTo('hero')}
            className="relative w-9 h-9 rounded-full flex items-center justify-center group cursor-pointer transition-transform duration-300 hover:scale-110"
          >
            {/* Animated gradient border */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="16.5"
                fill="none"
                stroke="url(#logoGradient)"
                strokeWidth="2"
                className="transition-all duration-500 group-hover:[stroke-dashoffset:0]"
                style={{
                  strokeDasharray: '100 150',
                  strokeDashoffset: '0',
                }}
              />
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#89AACC" />
                  <stop offset="100%" stopColor="#4E85BF" />
                </linearGradient>
              </defs>
            </svg>
            <span className="relative z-10 font-display italic text-[13px] text-text-primary">SO</span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center">
            <div className="w-px h-5 bg-stroke mx-1" />

            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`nav-link ${activeSection === link.id ? 'active' : 'inactive'}`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden ml-2 w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-text-primary hover:bg-stroke/50 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {mobileOpen ? (
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>

          <div className="w-px h-5 bg-stroke mx-1" />

          {/* Say hi button */}
          <a
            href="mailto:hello@studentos.app"
            className="relative rounded-full text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 text-muted hover:text-text-primary transition-all group"
          >
            <span className="absolute inset-0 rounded-full gradient-border-ring" />
            <span className="relative z-10 flex items-center gap-1 bg-surface rounded-full">
              Say hi
              <span className="text-xs opacity-60">↗</span>
            </span>
          </a>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="fixed top-20 left-4 right-4 z-50 md:hidden">
          <div className="bg-surface border border-stroke rounded-2xl p-3 backdrop-blur-md shadow-lg">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                  activeSection === link.id
                    ? 'text-text-primary bg-stroke/50'
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
