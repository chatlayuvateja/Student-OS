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

async function deleteData(url, body) {
  const config = body ? { data: body } : {};
  const { data } = await api.delete(url, config);
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

export function useUpdateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => putData(`/timetable/${id}`, { ...updates, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['timetable'] }); toast.success('Class updated'); },
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

export function useUploadNoteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, title, subject }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('subject', subject || '');
      formData.append('student_id', STUDENT_ID);
      const { data } = await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      toast.success('File uploaded successfully');
    },
    onError: () => toast.error('Upload failed. Check file type and size.'),
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

export function useDeleteTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId) => deleteData(`/roadmaps/topic/${topicId}`),
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
  return useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const data = await fetchData(`/resources/${STUDENT_ID}`);
      return data.resources || [];
    },
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resource) => postData('/resources', { ...resource, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Resource saved!'); },
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => putData(`/resources/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Resource updated'); },
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/resources/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['resources'] }); toast.success('Resource removed'); },
  });
}

// === Topic Resources ===
export function useTopicResources(topicId) {
  return useQuery({
    queryKey: ['topic-resources', topicId],
    queryFn: () => fetchData(`/roadmaps/topic/${topicId}/resources`),
    enabled: !!topicId,
  });
}

export function useAddTopicResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, ...data }) => postData(`/roadmaps/topic/${topicId}/resources`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['topic-resources', variables.topicId] });
      toast.success('Resource added to topic');
    },
  });
}

export function useUpdateTopicResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, resourceId, ...data }) => putData(`/roadmaps/topic/${topicId}/resources/${resourceId}`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['topic-resources', variables.topicId] });
      toast.success('Resource updated');
    },
  });
}

export function useDeleteTopicResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, resourceId }) => deleteData(`/roadmaps/topic/${topicId}/resources/${resourceId}`),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['topic-resources', variables.topicId] });
      toast.success('Resource removed from topic');
    },
  });
}

export function useDeleteRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/roadmaps/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmaps'] }); toast.success('Roadmap deleted'); },
  });
}

export function useUpdateRoadmap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => putData(`/roadmaps/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roadmaps'] }); toast.success('Roadmap updated'); },
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

// === Settings ===
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => fetchData(`/settings/${STUDENT_ID}`),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates) => putData(`/settings/${STUDENT_ID}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings updated'); },
  });
}

// === Subjects ===
export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => fetchData(`/subjects/${STUDENT_ID}`),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subject) => postData('/subjects', { ...subject, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject added'); },
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...updates }) => putData(`/subjects/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject updated'); },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteData(`/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects'] }); toast.success('Subject removed'); },
  });
}

// === Backup ===
export function useDownloadBackup() {
  return () => {
    window.open(`${API_BASE}/backup`, '_blank');
  };
}

export function useResetBackup() {
  return useMutation({
    mutationFn: ({ filename, confirm }) => deleteData(`/backup/reset/${filename}`, { confirm }),
    onSuccess: () => toast.success('Data reset'),
  });
}

export function useCollegeCalendar() {
  return useQuery({ queryKey: ['calendar'], queryFn: () => fetchData(`/college-calendar/${STUDENT_ID}`) });
}

export function useCreateCollegeEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (event) => postData('/college-calendar', { ...event, student_id: STUDENT_ID }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['calendar'] }); toast.success('Event created'); },
  });
}

// === Working Days Config ===
export function useWorkingDaysConfig() {
  return useQuery({
    queryKey: ['working-days'],
    queryFn: () => fetchData(`/working-days/${STUDENT_ID}`),
  });
}

export function useUpdateWorkingDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (working_days) => putData(`/working-days/${STUDENT_ID}`, { working_days }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['working-days'] }); toast.success('Working days updated'); },
  });
}

export function useAddHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, reason }) => postData(`/working-days/${STUDENT_ID}/holiday`, { date, reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['working-days'] }); toast.success('Holiday added'); },
  });
}

export function useRemoveHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date) => deleteData(`/working-days/${STUDENT_ID}/holiday/${date}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['working-days'] }); toast.success('Holiday removed'); },
  });
}

export default api;
