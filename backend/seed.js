import { insertOne, writeData } from './utils/fileStore.js';

async function seed() {
  console.log('🌱 Seeding Student OS with sample data...\n');

  const studentId = 'student-1';
  const today = new Date().toISOString();

  // Profile
  await writeData('profile.json', {
    id: studentId,
    name: 'Alex Chen',
    college: 'Stanford University',
    semester: 3,
    year: 2,
    gpa_scale: 4.0,
    focus_goal: 4,
    attendance_threshold: 75,
    timezone: 'America/New_York',
    subjects: ['Data Structures', 'Algorithms', 'Mathematics', 'Physics', 'English Literature'],
    profile_photo_url: null,
    created_at: today,
    updated_at: today,
  });
  console.log('✅ Profile seeded');

  // Timetable
  const timetableData = [
    { student_id: studentId, day_of_week: 1, subject_name: 'Data Structures', start_time: '09:00', end_time: '10:30', room: 'CS 301', professor: 'Dr. Patel', color_tag: '#6366f1' },
    { student_id: studentId, day_of_week: 1, subject_name: 'Mathematics', start_time: '11:00', end_time: '12:30', room: 'Math 205', professor: 'Dr. Kim', color_tag: '#F5A623' },
    { student_id: studentId, day_of_week: 2, subject_name: 'Algorithms', start_time: '10:00', end_time: '11:30', room: 'CS 205', professor: 'Prof. Johnson', color_tag: '#FF6B6B' },
    { student_id: studentId, day_of_week: 2, subject_name: 'Physics', start_time: '14:00', end_time: '15:30', room: 'Sci 102', professor: 'Dr. Martinez', color_tag: '#00C2A8' },
    { student_id: studentId, day_of_week: 3, subject_name: 'Data Structures', start_time: '09:00', end_time: '10:30', room: 'CS 301', professor: 'Dr. Patel', color_tag: '#6366f1' },
    { student_id: studentId, day_of_week: 3, subject_name: 'English Literature', start_time: '13:00', end_time: '14:30', room: 'Hum 110', professor: 'Dr. Williams', color_tag: '#8B5CF6' },
    { student_id: studentId, day_of_week: 4, subject_name: 'Algorithms', start_time: '10:00', end_time: '11:30', room: 'CS 205', professor: 'Prof. Johnson', color_tag: '#FF6B6B' },
    { student_id: studentId, day_of_week: 4, subject_name: 'Mathematics', start_time: '14:00', end_time: '15:30', room: 'Math 205', professor: 'Dr. Kim', color_tag: '#F5A623' },
    { student_id: studentId, day_of_week: 5, subject_name: 'Physics', start_time: '09:00', end_time: '10:30', room: 'Sci 102', professor: 'Dr. Martinez', color_tag: '#00C2A8' },
    { student_id: studentId, day_of_week: 5, subject_name: 'English Literature', start_time: '11:00', end_time: '12:30', room: 'Hum 110', professor: 'Dr. Williams', color_tag: '#8B5CF6' },
  ];
  for (const entry of timetableData) {
    await insertOne('timetable.json', entry);
  }
  console.log('✅ Timetable seeded (10 entries)');

  // Habits
  const habitsData = [
    { student_id: studentId, name: 'Morning Study', icon: '📚', frequency: 'daily', color: '#6366f1' },
    { student_id: studentId, name: 'Exercise', icon: '🏃', frequency: 'daily', color: '#00C2A8' },
    { student_id: studentId, name: 'Read News', icon: '📰', frequency: 'daily', color: '#F5A623' },
    { student_id: studentId, name: 'Meditate', icon: '🧘', frequency: 'daily', color: '#8B5CF6' },
    { student_id: studentId, name: 'Review Notes', icon: '📝', frequency: 'weekly', color: '#FF6B6B' },
  ];
  const savedHabits = [];
  for (const habit of habitsData) {
    const saved = await insertOne('habits.json', habit);
    savedHabits.push(saved);
  }
  console.log('✅ Habits seeded (5 habits)');

  // Habit completions (last 30 days)
  for (const habit of savedHabits.slice(0, 3)) {
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (Math.random() > 0.3) {
        await insertOne('habit_completions.json', {
          habit_id: habit.id,
          student_id: studentId,
          completed_date: d.toISOString().split('T')[0],
          note: '',
        });
      }
    }
  }
  console.log('✅ Habit completions seeded');

  // Focus sessions (last 14 days)
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const sessions = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < sessions; j++) {
      const startH = 9 + Math.floor(Math.random() * 8);
      const duration = [25, 25, 25, 30, 50, 15][Math.floor(Math.random() * 6)];
      const startDate = new Date(d);
      startDate.setHours(startH, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      await insertOne('focus_sessions.json', {
        student_id: studentId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_minutes: duration,
        session_type: duration <= 15 ? 'break' : 'focus',
        date: d.toISOString().split('T')[0],
        notes: '',
      });
    }
  }
  console.log('✅ Focus sessions seeded');

  // Sticky notes
  const stickyNotes = [
    { student_id: studentId, title: 'Exam Dates', content: 'Midterms start March 15!\n- DS: March 17\n- Algorithms: March 19\n- Math: March 22', color: '#FFF8E1', is_pinned: true, subject_tag: 'exams', rotation: 2 },
    { student_id: studentId, title: 'Book to Read', content: '"Designing Data-Intensive Applications" by Martin Kleppmann. Chapter 3 this week.', color: '#FFE0F0', is_pinned: false, subject_tag: 'reading', rotation: -1.5 },
    { student_id: studentId, title: 'Project Idea', content: 'Build a study group matching app using React Native. Could be a great portfolio piece!', color: '#EDE0FF', is_pinned: false, subject_tag: 'projects', rotation: 3 },
    { student_id: studentId, title: 'Office Hours', content: 'Dr. Patel: Mon/Wed 2-4pm\nDr. Kim: Tue/Thu 1-3pm\nProf. Johnson: Fri 10-12pm', color: '#E0FFF5', is_pinned: true, subject_tag: 'academic', rotation: -2.5 },
    { student_id: studentId, title: 'Quote', content: '"The best time to plant a tree was 20 years ago. The second best time is now." — Chinese Proverb', color: '#FFEDE0', is_pinned: false, rotation: 1 },
  ];
  for (const note of stickyNotes) {
    await insertOne('sticky_notes.json', note);
  }
  console.log('✅ Sticky notes seeded');

  // Courses
  const courses = [
    { student_id: studentId, semester_id: 'sem-1', name: 'Data Structures', credit_hours: 4, grade_letter: 'A', grade_points: 4.0 },
    { student_id: studentId, semester_id: 'sem-1', name: 'Algorithms', credit_hours: 4, grade_letter: 'A-', grade_points: 3.7 },
    { student_id: studentId, semester_id: 'sem-1', name: 'Calculus II', credit_hours: 3, grade_letter: 'B+', grade_points: 3.3 },
    { student_id: studentId, semester_id: 'sem-1', name: 'Physics I', credit_hours: 4, grade_letter: 'A', grade_points: 4.0 },
    { student_id: studentId, semester_id: 'sem-1', name: 'English Composition', credit_hours: 3, grade_letter: 'B', grade_points: 3.0 },
    { student_id: studentId, semester_id: 'sem-2', name: 'Advanced Data Structures', credit_hours: 4, grade_letter: 'A', grade_points: 4.0 },
    { student_id: studentId, semester_id: 'sem-2', name: 'Machine Learning', credit_hours: 3, grade_letter: 'A-', grade_points: 3.7 },
    { student_id: studentId, semester_id: 'sem-2', name: 'Linear Algebra', credit_hours: 3, grade_letter: 'A', grade_points: 4.0 },
    { student_id: studentId, semester_id: 'sem-2', name: 'Physics II', credit_hours: 4, grade_letter: 'B+', grade_points: 3.3 },
  ];
  for (const course of courses) {
    await insertOne('courses.json', course);
  }
  console.log('✅ Courses seeded');

  // Semesters
  const semesters = [
    { student_id: studentId, name: 'Fall', year: '2024', cgpa: 3.62 },
    { student_id: studentId, name: 'Spring', year: '2025', cgpa: 3.78 },
  ];
  for (const sem of semesters) {
    await insertOne('semesters.json', sem);
  }
  console.log('✅ Semesters seeded');

  // Class notes
  const classNotes = [
    { student_id: studentId, title: 'Binary Search Trees', content: 'BST is a node-based data structure where each node has at most two children (left and right). The left subtree contains values less than the parent node, and the right subtree contains values greater than the parent node.\n\nKey Operations:\n- Search: O(h) where h is height\n- Insert: O(h)\n- Delete: O(h)\n\nBalanced BSTs (AVL, Red-Black) maintain O(log n) operations.', subject: 'Data Structures', color: '#6366f1', word_count: 80 },
    { student_id: studentId, title: 'Sorting Algorithms', content: 'Comparison-based sorting:\n1. Bubble Sort - O(n²)\n2. Merge Sort - O(n log n)\n3. Quick Sort - O(n log n) average\n4. Heap Sort - O(n log n)\n\nNon-comparison based:\n1. Counting Sort - O(n+k)\n2. Radix Sort - O(d(n+k))\n\nMerge Sort is stable, Quick Sort is not.', subject: 'Algorithms', color: '#FF6B6B', word_count: 75 },
    { student_id: studentId, title: 'Newton\'s Laws', content: 'First Law (Law of Inertia): An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.\n\nSecond Law: F = ma (Force = mass × acceleration)\n\nThird Law: For every action, there is an equal and opposite reaction.\n\nApplications: projectile motion, friction, circular motion.', subject: 'Physics', color: '#00C2A8', word_count: 70 },
  ];
  for (const note of classNotes) {
    await insertOne('class_notes.json', note);
  }
  console.log('✅ Class notes seeded');

  // Roadmaps
  const rm = await insertOne('roadmaps.json', {
    student_id: studentId,
    skill_name: 'Machine Learning',
    description: 'Complete ML learning path from fundamentals to advanced topics',
  });

  const mlTopics = [
    { roadmap_id: rm.id, topic_name: 'Linear Regression', description: 'Simple and multiple linear regression', order_index: 0, level: 'beginner', is_completed: true },
    { roadmap_id: rm.id, topic_name: 'Logistic Regression', description: 'Classification with logistic regression', order_index: 1, level: 'beginner', is_completed: true },
    { roadmap_id: rm.id, topic_name: 'Decision Trees & Random Forests', description: 'Ensemble learning methods', order_index: 2, level: 'intermediate', is_completed: false },
    { roadmap_id: rm.id, topic_name: 'Neural Networks', description: 'ANN, CNN, RNN architectures', order_index: 3, level: 'intermediate', is_completed: false },
    { roadmap_id: rm.id, topic_name: 'Deep Learning', description: 'Advanced deep learning concepts', order_index: 4, level: 'advanced', is_completed: false },
  ];
  for (const topic of mlTopics) {
    await insertOne('roadmap_topics.json', topic);
  }
  console.log('✅ Roadmaps seeded');

  // Attendance records
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      await insertOne('attendance_records.json', {
        student_id: studentId,
        subject_id: 'ds-1',
        date: d.toISOString().split('T')[0],
        status: Math.random() > 0.15 ? 'present' : Math.random() > 0.5 ? 'absent' : 'bunk',
        timetable_slot_id: 'slot-1',
      });
    }
  }
  console.log('✅ Attendance records seeded');

  // Resources
  const resources = [
    { student_id: studentId, title: 'GitHub - CS Study Guide', description: 'Comprehensive computer science study resources', url: 'https://github.com/ossu/computer-science', type: 'link', subject_tag: 'CS', thumbnail_url: null, category: 'Study Guides' },
    { student_id: studentId, title: '3Blue1Brown - Linear Algebra', description: 'Essence of linear algebra series', url: 'https://youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', type: 'youtube', subject_tag: 'Mathematics', thumbnail_url: null, category: 'Video Tutorials' },
    { student_id: studentId, title: 'LeetCode', description: 'Practice coding problems', url: 'https://leetcode.com', type: 'tool', subject_tag: 'Algorithms', thumbnail_url: null, category: 'Practice' },
  ];
  for (const resource of resources) {
    await insertOne('resources.json', resource);
  }
  console.log('✅ Resources seeded');

  // Resource categories
  await insertOne('resource_categories.json', { student_id: studentId, name: 'Study Guides', color: '#6366f1', icon: '📚' });
  await insertOne('resource_categories.json', { student_id: studentId, name: 'Video Tutorials', color: '#FF6B6B', icon: '🎬' });
  await insertOne('resource_categories.json', { student_id: studentId, name: 'Practice', color: '#00C2A8', icon: '⚡' });
  console.log('✅ Resource categories seeded');

  // Attendance settings
  await writeData('attendance_settings.json', {
    student_id: studentId,
    minimum_threshold: 75,
    count_leaves_as_absent: false,
  });
  console.log('✅ Attendance settings seeded');

  console.log('\n✨ Seed complete! Student OS is ready to use.');
  console.log('   Start the backend: cd backend && npm run dev');
  console.log('   Start the frontend: cd frontend && npm run dev');
}

seed().catch(console.error);
