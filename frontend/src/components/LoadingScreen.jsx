import React, { useEffect, useRef, useState } from 'react';

const words = ['Design', 'Create', 'Inspire'];

function LoadingScreen({ onComplete }) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const containerRef = useRef(null);
  const labelRef = useRef(null);
  const counterRef = useRef(null);

  useEffect(() => {
    // Entrance animations using CSS transitions
    if (labelRef.current) {
      labelRef.current.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      labelRef.current.style.opacity = '1';
      labelRef.current.style.transform = 'translateY(0)';
    }
    if (counterRef.current) {
      counterRef.current.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      counterRef.current.style.opacity = '1';
      counterRef.current.style.transform = 'translateY(0)';
    }
  }, []);

  useEffect(() => {
    // Cycle words every 900ms
    const wordInterval = setInterval(() => {
      setWordIndex(prev => (prev + 1) % words.length);
    }, 900);
    return () => clearInterval(wordInterval);
  }, []);

  useEffect(() => {
    // Animated counter 000 → 100 over 2700ms using requestAnimationFrame
    const duration = 2700;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentCount = Math.round(progress * 100);
      setCount(currentCount);

      if (currentCount < 100) {
        requestAnimationFrame(animate);
      } else {
        // Delay then complete
        setTimeout(onComplete, 400);
      }
    };

    requestAnimationFrame(animate);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-bg flex flex-col"
    >
      {/* Top-left label */}
      <div ref={labelRef} className="absolute top-8 left-8 md:top-10 md:left-10" style={{ opacity: 0, transform: 'translateY(-20px)' }}>
        <span className="text-xs text-muted uppercase tracking-[0.3em]">Portfolio</span>
      </div>

      {/* Center rotating words with animation */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative h-16 md:h-20 lg:h-24 overflow-hidden">
          <div key={wordIndex} className="text-4xl md:text-6xl lg:text-7xl font-display italic text-text-primary/80 animate-role-fade-in">
            {words[wordIndex]}
          </div>
        </div>
      </div>

      {/* Bottom-right counter */}
      <div ref={counterRef} className="absolute bottom-24 md:bottom-16 right-8 md:right-10 lg:right-16" style={{ opacity: 0, transform: 'translateY(20px)' }}>
        <span className="text-6xl md:text-8xl lg:text-9xl font-display text-text-primary tabular-nums">
          {String(count).padStart(3, '0')}
        </span>
      </div>

      {/* Bottom progress bar */}
      <div className="absolute bottom-12 md:bottom-8 left-8 right-8 md:left-10 md:right-10 lg:left-16 lg:right-16">
        <div className="h-[3px] bg-stroke/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full accent-gradient"
            style={{
              transform: `scaleX(${count / 100})`,
              transformOrigin: 'left',
              boxShadow: '0 0 8px rgba(137, 170, 204, 0.35)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
