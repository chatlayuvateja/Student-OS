import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Student ID (single student local app)
const STUDENT_ID = 'student-1';

// Generic fetch helper
async function fetchData(url) {
  const { data } = await api.get(url);
  return data.data;
}

async function postData(url, body) {
  const { data } = await api.post(url, body);
  return data.data;
}

async function putData(url, body) {
  const { data } = await api.put(url, body);
  return data.data;
}

async function deleteData(url) {
  const { data } = await api.delete(url);
  return data.data;
}

// === Profile ===
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchData(`/profile/${STUDENT_ID}`),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates) => putData(`/profile/${STUDENT_ID}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile updated'); },
  });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile photo updated'); },
  });
}

// === Timetable ===
export function useTimetable() {
  return useQuery({
    queryKey: ['timetable'],
    queryFn: () => fetchData(`/timetable/${STUDENT_ID}`),
  });
}

export function useCreateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry) => postData('/timetable', { ...entry, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable'] }); toast.success('Class added'); },
  });
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/timetable/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable'] }); toast.success('Class removed'); },
  });
}

// === Habits ===
export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: () => fetchData(`/habits/${STUDENT_ID}`),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (habit) => postData('/habits', { ...habit, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); toast.success('Habit created!'); },
  });
}

export function useCompleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => postData(`/habits/${id}/complete`, { student_id: STUDENT_ID, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); qc.invalidateQueries({ queryKey: ['habit-history'] }); toast.success('Habit completed!'); },
  });
}

export function useHabitHistory(habitId) {
  return useQuery({
    queryKey: ['habit-history', habitId],
    queryFn: () => fetchData(`/habits/${habitId}/history`),
    enabled: !!habitId,
  });
}

// === Focus ===
export function useFocusSessions() {
  return useQuery({
    queryKey: ['focus-sessions'],
    queryFn: () => fetchData(`/focus/${STUDENT_ID}`),
  });
}

export function useCreateFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (session) => postData('/focus/session', { ...session, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['focus-sessions'] }); },
  });
}

export function useWeeklyReport() {
  return useQuery({ queryKey: ['focus-weekly'], queryFn: () => fetchData(`/focus/report/weekly/${STUDENT_ID}`) });
}

export function useMonthlyReport() {
  return useQuery({ queryKey: ['focus-monthly'], queryFn: () => fetchData(`/focus/report/monthly/${STUDENT_ID}`) });
}

export function useYearlyReport() {
  return useQuery({ queryKey: ['focus-yearly'], queryFn: () => fetchData(`/focus/report/yearly/${STUDENT_ID}`) });
}

// === Sticky Notes ===
export function useStickyNotes() {
  return useQuery({ queryKey: ['stickynotes'], queryFn: () => fetchData(`/stickynotes/${STUDENT_ID}`) });
}

export function useCreateStickyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note) => postData('/stickynotes', { ...note, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stickynotes'] }); toast.success('Note added!'); },
  });
}

export function useUpdateStickyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => putData(`/stickynotes/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stickynotes'] }); },
  });
}

export function useDeleteStickyNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/stickynotes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stickynotes'] }); toast.success('Note deleted'); },
  });
}

// === Notes ===
export function useNotes() {
  return useQuery({ queryKey: ['notes'], queryFn: () => fetchData(`/notes/${STUDENT_ID}`) });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note) => postData('/notes', { ...note, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); toast.success('Note created!'); },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => putData(`/notes/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/notes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); toast.success('Note deleted'); },
  });
}

// === Courses / CGPA ===
export function useCourses() {
  return useQuery({ queryKey: ['courses'], queryFn: () => fetchData(`/courses/${STUDENT_ID}`) });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (course) => postData('/courses', { ...course, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); qc.invalidateQueries({ queryKey: ['cgpa'] }); },
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/courses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); qc.invalidateQueries({ queryKey: ['cgpa'] }); },
  });
}

export function useCGPA() {
  return useQuery({ queryKey: ['cgpa'], queryFn: () => fetchData('/cgpa/calculate/' + STUDENT_ID) });
}

export function useSemesters() {
  return useQuery({ queryKey: ['semesters'], queryFn: () => fetchData(`/semesters/${STUDENT_ID}`) });
}

// === Roadmaps ===
export function useRoadmaps() {
  return useQuery({ queryKey: ['roadmaps'], queryFn: () => fetchData(`/roadmaps/${STUDENT_ID}`) });
}

export function useCreateRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rm) => postData('/roadmaps', { ...rm, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmaps'] }); toast.success('Roadmap created!'); },
  });
}

export function useCompleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, topicId }) => postData(`/roadmaps/${roadmapId}/topic/${topicId}/complete`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmaps'] }); toast.success('Topic completed!'); },
  });
}

export function useAddTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, ...topic }) => postData(`/roadmaps/${roadmapId}/topic`, topic),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmaps'] }); },
  });
}

// === Attendance ===
export function useAttendanceSummary() {
  return useQuery({ queryKey: ['attendance'], queryFn: () => fetchData(`/attendance/summary/${STUDENT_ID}`) });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (record) => postData('/attendance/mark', { ...record, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance'] }); },
  });
}

// === Resources ===
export function useResources() {
  return useQuery({ queryKey: ['resources'], queryFn: () => fetchData(`/resources/${STUDENT_ID}`) });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resource) => postData('/resources', { ...resource, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Resource saved!'); },
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/resources/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Resource removed'); },
  });
}

// === AI Chat ===
export function useAIChat() {
  return useQuery({ queryKey: ['ai-chat'], queryFn: () => fetchData(`/ai/history/${STUDENT_ID}`) });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messages, sessionId }) => postData('/ai/chat', { student_id: STUDENT_ID, messages, session_id: sessionId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ai-chat'] }); },
  });
}

// === Backup ===
export function useDownloadBackup() {
  return () => {
    window.open(`${API_BASE}/backup`, '_blank');
  };
}

export function useCollegeCalendar() {
  return useQuery({ queryKey: ['calendar'], queryFn: () => fetchData(`/college-calendar/${STUDENT_ID}`) });
}

export default api;
