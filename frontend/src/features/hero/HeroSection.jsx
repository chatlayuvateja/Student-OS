import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hls from 'hls.js';

gsap.registerPlugin(ScrollTrigger);

const roles = ['Creative', 'Fullstack', 'Founder', 'Scholar'];

function HeroSection() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const nameRef = useRef(null);
  const blurRef = useRef(null);
  const contentRef = useRef(null);
  const [roleIndex, setRoleIndex] = useState(0);
  const [hlsReady, setHlsReady] = useState(false);

  // HLS video setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8';

    let hlsInstance = null;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => setHlsReady(true));
    } else if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(src);
      hlsInstance.attachMedia(video);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => setHlsReady(true));
    }

    return () => {
      if (hlsInstance) hlsInstance.destroy();
    };
  }, []);

  // Cycle roles
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex(prev => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      nameRef.current?.querySelectorAll('.name-reveal'),
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, delay: 0.1, stagger: 0.05 }
    )
    .fromTo(
      blurRef.current?.querySelectorAll('.blur-in'),
      { opacity: 0, y: 20, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.1, delay: 0.3 },
      '-=0.4'
    );

    return () => tl.kill();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative h-screen overflow-hidden bg-bg">
      {/* Background Video */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute top-1/2 left-1/2 min-w-full min-h-full object-cover -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 ${hlsReady ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/20" />
        {/* Bottom fade to bg */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent" />
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
        {/* Eyebrow */}
        <div ref={blurRef}>
          <p className="blur-in text-xs text-muted uppercase tracking-[0.3em] mb-8">
            COLLECTION '26
          </p>
        </div>

        {/* Name */}
        <div ref={nameRef} className="mb-6">
          <h1 className="name-reveal text-6xl md:text-8xl lg:text-9xl font-display italic leading-[0.9] tracking-tight text-text-primary">
            Student OS
          </h1>
        </div>

        {/* Role line */}
        <div className="blur-in mb-8">
          <p className="text-sm md:text-base text-muted">
            An{' '}
            <span
              key={roleIndex}
              className="font-display italic text-text-primary inline-block animate-role-fade-in"
            >
              {roles[roleIndex]}
            </span>{' '}
            academic command center.
          </p>
        </div>

        {/* Description */}
        <p className="blur-in text-sm md:text-base text-muted max-w-md mb-12">
          Your all-in-one dashboard for managing classes, tracking habits,
          taking notes, and staying on top of your academic journey.
        </p>

        {/* CTA Buttons */}
        <div className="blur-in inline-flex gap-4">
          <button
            onClick={() => scrollToSection('timetable')}
            className="btn-primary gradient-border-ring"
          >
            Get Started
          </button>
          <button
            onClick={() => scrollToSection('aichat')}
            className="btn-outline gradient-border-ring"
          >
            Meet AI Assistant
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-xs text-muted uppercase tracking-[0.2em]">SCROLL</span>
        <div className="w-px h-10 bg-stroke relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-text-primary animate-scroll-down" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
