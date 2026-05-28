import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useCGPA, useCourses, useCreateCourse, useDeleteCourse, useSemesters } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

const GRADE_POINTS_4 = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0 };
const GRADE_POINTS_10 = { 'A': 10, 'A-': 9, 'B+': 8, 'B': 7, 'B-': 6, 'C+': 5, 'C': 4, 'D': 3, 'F': 0 };

function CGPASection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const gaugeRef = useRef(null);
  const [gpaScale, setGpaScale] = useState(4.0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', credit_hours: 3, grade_letter: 'B', semester_id: '' });
  const [whatIfGrade, setWhatIfGrade] = useState({});

  const { data: cgpaData } = useCGPA();
  const { data: courses = [] } = useCourses();
  const { data: semesters = [] } = useSemesters();
  const createCourse = useCreateCourse();
  const deleteCourse = useDeleteCourse();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      // Animate gauge - simple arc animation
      if (gaugeRef.current) {
        gsap.fromTo(gaugeRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power3.out', scrollTrigger: { trigger: gaugeRef.current, start: 'top 80%' } });
      }
    });
    return () => ctx.revert();
  }, []);

  const gradePoints = gpaScale === 4.0 ? GRADE_POINTS_4 : GRADE_POINTS_10;

  const getGpaColor = (gpa) => {
    if (gpaScale === 4.0) {
      if (gpa >= 3.5) return '#F5A623';
      if (gpa >= 3.0) return '#00C2A8';
      if (gpa >= 2.5) return '#6366f1';
      return '#FF6B6B';
    }
    if (gpa >= 8.5) return '#F5A623';
    if (gpa >= 7.0) return '#00C2A8';
    if (gpa >= 6.0) return '#6366f1';
    return '#FF6B6B';
  };

  const gpa = cgpaData?.gpa || 0;
  const maxGpa = gpaScale;
  const percentage = (gpa / maxGpa) * 100;

  const getMotivation = () => {
    const pct = (gpa / maxGpa) * 100;
    if (pct >= 90) return { msg: "Exceptional! You're setting the gold standard. 🌟", emoji: '🌟' };
    if (pct >= 80) return { msg: "Outstanding work! Keep that momentum going. 🚀", emoji: '🚀' };
    if (pct >= 70) return { msg: "Solid performance! Room to grow even higher. 💪", emoji: '💪' };
    if (pct >= 60) return { msg: "You're on the right track. Stay focused! 📈", emoji: '📈' };
    return { msg: "Every great comeback starts now. You've got this! 🔥", emoji: '🔥' };
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    const gp = gradePoints[form.grade_letter] || 0;
    createCourse.mutate({ ...form, grade_points: gp, semester_id: form.semester_id || undefined });
    setShowAdd(false);
    setForm({ name: '', credit_hours: 3, grade_letter: 'B', semester_id: '' });
  };

  // What-if calculation
  const getWhatIfGpa = (courseId, newGrade) => {
    const newGp = gradePoints[newGrade] || 0;
    let totalCredits = 0;
    let totalPoints = 0;
    courses.forEach(c => {
      const gp = c.id === courseId ? newGp : (c.grade_points || 0);
      totalCredits += c.credit_hours || 0;
      totalPoints += (c.credit_hours || 0) * gp;
    });
    return totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  };

  const semesterProgression = semesters.map(s => ({
    name: `${s.name} '${s.year}`,
    gpa: s.cgpa || 0,
  }));

  return (
    <section ref={sectionRef} className="relative py-28 lg:py-36">
      <div className="section-container">
        <div ref={titleRef} className="mb-12">
          <h2 className="section-title">Your Academic Score,<br />Visualized</h2>
          <p className="section-subtitle mt-4">Track your progress. Simulate your future.</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setGpaScale(4.0)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${gpaScale === 4.0 ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-50 text-indigo-400'}`}>4.0 Scale</button>
            <button onClick={() => setGpaScale(10.0)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${gpaScale === 10.0 ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-50 text-indigo-400'}`}>10.0 Scale</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gauge and motivation */}
          <div className="space-y-6">
            <div ref={gaugeRef} className="glass-card p-8 text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(59,31,168,0.06)" strokeWidth="12" />
                  <circle cx="100" cy="100" r="85" fill="none" stroke={getGpaColor(gpa)} strokeWidth="12"
                    strokeDasharray={`${percentage * 5.34} 534`} strokeLinecap="round"
                    transform="rotate(-90 100 100)" style={{ transition: 'stroke-dasharray 1.5s ease' }} />
                </svg>
                <div className="absolute text-center">
                  <p className="text-4xl font-mono font-bold" style={{ color: getGpaColor(gpa) }}>{gpa.toFixed(2)}</p>
                  <p className="text-xs text-indigo-400/40">CGPA</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium" style={{ color: getGpaColor(gpa) }}>{getMotivation().msg}</p>
            </div>

            <button onClick={() => setShowAdd(true)} className="w-full py-3 rounded-2xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #F5A623, #FF6B6B)' }}>
              + Add Course
            </button>
          </div>

          {/* Course breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: '#1a1a2e' }}>Course Breakdown</h4>
            <div className="glass-card p-5 max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-indigo-400/60 text-xs border-b border-indigo-50">
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium">Credits</th>
                    <th className="pb-3 font-medium">Grade</th>
                    <th className="pb-3 font-medium">What-If</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} className="border-b border-indigo-50/50">
                      <td className="py-3 font-medium" style={{ color: '#1a1a2e' }}>{c.name}</td>
                      <td className="py-3 text-indigo-400/60">{c.credit_hours}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          (c.grade_points || 0) >= (gpaScale === 4.0 ? 3.5 : 8) ? 'bg-green-50 text-green-600' :
                          (c.grade_points || 0) >= (gpaScale === 4.0 ? 2.5 : 6) ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                        }`}>{c.grade_letter}</span>
                      </td>
                      <td className="py-3">
                        <select
                          value={whatIfGrade[c.id] || ''}
                          onChange={(e) => setWhatIfGrade({...whatIfGrade, [c.id]: e.target.value})}
                          className="text-xs px-2 py-1 rounded-lg border border-indigo-100 outline-none"
                        >
                          <option value="">—</option>
                          {Object.keys(gradePoints).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        {whatIfGrade[c.id] && (
                          <p className="text-[10px] mt-1 font-medium" style={{ color: getGpaColor(getWhatIfGpa(c.id, whatIfGrade[c.id])) }}>
                            GPA: {getWhatIfGpa(c.id, whatIfGrade[c.id]).toFixed(2)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {courses.length === 0 && <p className="text-center py-8 text-indigo-400/40 text-sm">No courses added yet.</p>}
            </div>
          </div>
        </div>

        {/* Semester progression chart */}
        {semesterProgression.length > 0 && (
          <div className="mt-12 glass-card p-6">
            <h4 className="text-sm font-semibold mb-4" style={{ color: '#1a1a2e' }}>CGPA Progression</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={semesterProgression}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,31,168,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(59,31,168,0.4)' }} />
                <YAxis domain={[0, gpaScale]} tick={{ fontSize: 12, fill: 'rgba(59,31,168,0.4)' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid rgba(59,31,168,0.1)', background: 'rgba(255,255,255,0.9)' }} />
                <Line type="monotone" dataKey="gpa" stroke="#3B1FA8" strokeWidth={2} dot={{ fill: '#3B1FA8', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="glass-card-strong p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-display font-semibold mb-6">Add Course</h3>
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-indigo-400/60 mb-1">Course Name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" placeholder="e.g. Data Structures" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Credit Hours</label>
                  <input type="number" value={form.credit_hours} onChange={e => setForm({...form, credit_hours: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm" min={1} max={6} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-400/60 mb-1">Grade</label>
                  <select value={form.grade_letter} onChange={e => setForm({...form, grade_letter: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:border-indigo-300 outline-none text-sm">
                    {Object.keys(gradePoints).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #F5A623, #FF6B6B)' }}>Add Course</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 rounded-xl text-sm font-medium text-indigo-400 bg-indigo-50 hover:bg-indigo-100 transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default CGPASection;
