import React, { useEffect, useState, Suspense, lazy } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Lazy load sections
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
const ContactFooter = lazy(() => import('./features/footer/ContactFooter'));

// Components
const LoadingScreen = lazy(() => import('./components/LoadingScreen'));
const Navbar = lazy(() => import('./components/Navbar'));

function SectionSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="skeleton w-3/4 h-48 max-w-[800px]" />
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

    return () => lenis.destroy();
  }, []);

  const sections = [
    { id: 'hero', Component: HeroSection },
    { id: 'timetable', Component: TimetableSection, title: 'Schedule' },
    { id: 'notes', Component: NotesSection, title: 'Notes' },
    { id: 'aichat', Component: AIChatSection, title: 'AI Assistant' },
    { id: 'stickynotes', Component: StickyNotesSection, title: 'Sticky Notes' },
    { id: 'habits', Component: HabitsSection, title: 'Habits' },
    { id: 'focus', Component: FocusSection, title: 'Focus' },
    { id: 'cgpa', Component: CGPASection, title: 'CGPA' },
    { id: 'roadmap', Component: RoadmapSection, title: 'Roadmap' },
    { id: 'attendance', Component: AttendanceSection, title: 'Attendance' },
    { id: 'resources', Component: ResourcesSection, title: 'Resources' },
    { id: 'profile', Component: ProfileSection, title: 'Profile' },
  ];

  return (
    <>
      {showLoader && (
        <Suspense fallback={null}>
          <LoadingScreen onComplete={() => setShowLoader(false)} />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <main className="bg-bg min-h-screen">
        {sections.map(({ id, Component }) => (
          <section key={id} id={`section-${id}`} className="relative">
            <Suspense fallback={<SectionSkeleton />}>
              <Component />
            </Suspense>
          </section>
        ))}

        {/* Footer */}
        <section id="section-footer">
          <Suspense fallback={null}>
            <ContactFooter />
          </Suspense>
        </section>
      </main>
    </>
  );
}

export default App;
