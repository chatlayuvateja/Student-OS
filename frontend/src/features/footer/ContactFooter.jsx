import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Hls from 'hls.js';

function ContactFooter() {
  const marqueeRef = useRef(null);
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  // HLS video footer background
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = 'https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8';

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
    }
  }, []);

  // GSAP Marquee
  useEffect(() => {
    const el = marqueeRef.current;
    if (!el) return;

    gsap.to(el, {
      xPercent: -50,
      duration: 40,
      ease: 'none',
      repeat: -1,
    });

    return () => {
      gsap.killTweensOf(el);
    };
  }, []);

  const socials = [
    { label: 'Twitter', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Dribbble', href: '#' },
    { label: 'GitHub', href: '#' },
  ];

  return (
    <footer ref={sectionRef} className="relative bg-bg pt-16 md:pt-20 pb-8 md:pb-12 overflow-hidden">
      {/* Background Video (flipped) */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover -translate-x-1/2 -translate-y-1/2 scale-y-[-1]"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* GSAP Marquee */}
      <div className="relative mb-16 md:mb-20 overflow-hidden">
        <div
          ref={marqueeRef}
          className="flex whitespace-nowrap"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="text-5xl md:text-7xl lg:text-8xl font-display italic text-white/5 mx-4"
            >
              BUILDING THE FUTURE •
            </span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-display italic text-text-primary mb-6">
          Let's build something{' '}
          <span className="accent-gradient-text">great</span>
        </h2>
        <a
          href="mailto:hello@studentos.app"
          className="relative inline-flex items-center gap-2 rounded-full text-sm px-8 py-4 text-text-primary transition-all hover:scale-105 gradient-border-ring"
        >
          <span className="relative z-10">hello@studentos.app</span>
          <span className="relative z-10 text-muted">↗</span>
        </a>
      </div>

      {/* Footer Bar */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-stroke">
          {/* Social links */}
          <div className="flex items-center gap-6">
            {socials.map(social => (
              <a
                key={social.label}
                href={social.href}
                className="text-xs text-muted hover:text-text-primary uppercase tracking-[0.15em] transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>

          {/* Availability */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-muted">Available for projects</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default ContactFooter;
