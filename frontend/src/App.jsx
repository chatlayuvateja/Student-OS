import React, { useEffect, useState, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Lazy load heavy sections
const HeroSection = lazy(() => import('./features/hero/HeroSection'));
const TimetableSection = lazy(() => import('./features/timetable/TimetableSection'));
const AIChatSection = lazy(() => import('./features/aichat/AIChatSection'));
const StickyNotesSection = lazy(() => import('./features/stickynotes/StickyNotesSection'));
const HabitsSection = lazy(() => import('./features/habits/HabitsSection'));
const CGPASection = lazy(() => import('./features/cgpa/CGPASection'));
const FocusSection = lazy(() => import('./features/focus/FocusSection'));
const NotesSection = lazy(() => import('./features/notes/NotesSection'));
const RoadmapSection = lazy(() => import('./features/roadmap/RoadmapSection'));
const AttendanceSection = lazy(() => import('./features/attendance/AttendanceSection'));
const ResourcesSection = lazy(() => import('./features/resources/ResourcesSection'));
const ProfileSection = lazy(() => import('./features/profile/ProfileSection'));

function SectionSkeleton({ height = '100vh' }) {
  return (
    <div className="section-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: '80%', height: '60%' }} />
    </div>
  );
}

// Cinematic Intro Loader
function IntroLoader({ onComplete }) {
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 800);
      },
    });

    tl.fromTo('.intro-title',
      { y: 80, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power4.out' }
    )
    .fromTo('.intro-subtitle',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.6'
    )
    .fromTo('.intro-loader-bar',
      { scaleX: 0 },
      { scaleX: 1, duration: 2.5, ease: 'power2.inOut' },
      '-=0.5'
    )
    .to('.intro-loader-bar-inner',
      { scaleX: 1, duration: 0.3, ease: 'power2.out' },
      '-=0.2'
    )
    .to('.intro-container',
      { opacity: 0, scale: 1.02, duration: 0.8, ease: 'power3.inOut' },
      '+=0.2'
    );
  }, []);

  return (
    <div className="intro-container fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFDF8]">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl animate-blob-delayed" />
      </div>

      <div className="text-center relative z-10">
        <h1 className="intro-title font-['Playfair_Display'] text-7xl md:text-8xl lg:text-9xl font-bold text-gray-900 mb-4">
          Student OS
        </h1>
        <p className="intro-subtitle text-lg md:text-xl text-gray-400 font-light tracking-widest uppercase">
          Your Academic Command Center
        </p>
        <div className="intro-loader-bar mt-12 mx-auto w-48 h-[2px] bg-gray-100 rounded-full overflow-hidden">
          <div className="intro-loader-bar-inner h-full w-full bg-gradient-to-r from-indigo-500 via-amber-400 to-indigo-500 rounded-full origin-left" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.config({ ignoreMobileResize: true });

    return () => {
      lenis.destroy();
    };
  }, []);

  const sections = [
    { id: 'hero', Component: HeroSection },
    { id: 'timetable', Component: TimetableSection },
    { id: 'aichat', Component: AIChatSection },
    { id: 'stickynotes', Component: StickyNotesSection },
    { id: 'habits', Component: HabitsSection },
    { id: 'cgpa', Component: CGPASection },
    { id: 'focus', Component: FocusSection },
    { id: 'notes', Component: NotesSection },
    { id: 'roadmap', Component: RoadmapSection },
    { id: 'attendance', Component: AttendanceSection },
    { id: 'resources', Component: ResourcesSection },
    { id: 'profile', Component: ProfileSection },
  ];

  return (
    <>
      {showLoader && <IntroLoader onComplete={() => setShowLoader(false)} />}
      <main className="bg-[#FFFDF8] min-h-screen">
        {sections.map(({ id, Component }) => (
          <section key={id} id={`section-${id}`} className="relative">
            <Suspense fallback={<SectionSkeleton />}>
              <Component />
            </Suspense>
          </section>
        ))}
      </main>
    </>
  );
}

export default App;
