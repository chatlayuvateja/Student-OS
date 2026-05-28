import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCGPA, useCourses, useCreateCourse, useDeleteCourse, useSemesters } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function CGPASection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  const { data: cgpa } = useCGPA();
  const { data: courses = [] } = useCourses();
  const { data: semesters = [] } = useSemesters();
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const currentCGPA = cgpa?.gpa || 0;
  const gradePoints = cgpa?.gradePoints || 0;
  const totalCredits = cgpa?.totalCredits || 0;

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="mb-10">
          <p className="section-eyebrow">Grades</p>
          <h2 className="section-heading">CGPA *tracker*</h2>
          <p className="section-subtext">Monitor your academic performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-8 text-center">
            <p className="text-5xl md:text-6xl font-display italic text-text-primary">{currentCGPA.toFixed(2)}</p>
            <p className="text-xs text-muted mt-2 uppercase tracking-wider">Current CGPA</p>
          </div>
          <div className="glass-card p-8 text-center">
            <p className="text-3xl font-display italic text-text-primary">{totalCredits}</p>
            <p className="text-xs text-muted mt-2 uppercase tracking-wider">Total Credits</p>
          </div>
          <div className="glass-card p-8 text-center">
            <p className="text-3xl font-display italic text-text-primary">{gradePoints.toFixed(2)}</p>
            <p className="text-xs text-muted mt-2 uppercase tracking-wider">Grade Points</p>
          </div>
        </div>

        {/* Courses */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-stroke">
            <p className="text-xs text-muted uppercase tracking-wider">Courses</p>
          </div>
          {courses.slice(-10).reverse().map(course => (
            <div key={course.id} className="flex items-center justify-between p-4 border-b border-stroke last:border-b-0 hover:bg-surface/30 transition-colors group">
              <div>
                <p className="text-sm text-text-primary">{course.name}</p>
                <p className="text-[10px] text-muted mt-0.5">{course.credit_hours} credits · Grade: {course.grade_letter}</p>
              </div>
              <button onClick={() => deleteCourse.mutate(course.id)}
                className="text-xs text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CGPASection;
