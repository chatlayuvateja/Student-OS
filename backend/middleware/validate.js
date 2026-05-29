import { z } from 'zod';

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          error: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
          data: null,
        });
      }
      next(err);
    }
  };
}

// Schemas
export const timetableSchema = z.object({
  student_id: z.string().min(1),
  day_of_week: z.number().min(0).max(6),
  subject_name: z.string().min(1),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  room: z.string().optional().default(''),
  professor: z.string().optional().default(''),
  color_tag: z.string().optional().default('#6366f1'),
});

export const habitSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional().default('📌'),
  frequency: z.enum(['daily', 'weekly']),
  color: z.string().optional().default('#6366f1'),
});

export const stickyNoteSchema = z.object({
  student_id: z.string().min(1),
  title: z.string().optional().default(''),
  content: z.string().optional().default(''),
  color: z.string().optional().default('#FFF8E1'),
  is_pinned: z.boolean().optional().default(false),
  subject_tag: z.string().optional().default(''),
  rotation: z.number().optional().default(0),
  position_x: z.number().optional().default(0),
  position_y: z.number().optional().default(0),
});

export const focusSessionSchema = z.object({
  student_id: z.string().min(1),
  start_time: z.string(),
  end_time: z.string(),
  duration_minutes: z.number().positive(),
  session_type: z.enum(['focus', 'break']),
  date: z.string(),
  notes: z.string().optional().default(''),
});

export const courseSchema = z.object({
  student_id: z.string().min(1),
  semester_id: z.string(),
  name: z.string().min(1),
  credit_hours: z.number().positive(),
  grade_letter: z.string(),
  grade_points: z.number().min(0).max(4.33),
});

export const noteSchema = z.object({
  student_id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional().default(''),
  content_html: z.string().optional().default(''),
  subject: z.string().optional().default('General'),
  color: z.string().optional().default('#6366f1'),
  tags_array: z.array(z.string()).optional().default([]),
  word_count: z.number().optional().default(0),
  is_exam_pinned: z.boolean().optional().default(false),
});

export const roadmapSchema = z.object({
  student_id: z.string().min(1),
  skill_name: z.string().min(1),
  description: z.string().optional().default(''),
});

export const roadmapTopicSchema = z.object({
  roadmap_id: z.string(),
  topic_name: z.string().min(1),
  description: z.string().optional().default(''),
  order_index: z.number().min(0),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
  is_completed: z.boolean().optional().default(false),
});

export const attendanceSchema = z.object({
  student_id: z.string().min(1),
  subject_id: z.string(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'bunk', 'holiday']),
  timetable_slot_id: z.string().optional().default(''),
});

export const resourceSchema = z.object({
  student_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  url: z.string().optional().default(''),
  type: z.enum(['link', 'youtube', 'pdf', 'note', 'tool']),
  thumbnail_url: z.string().nullable().optional().default(null),
  subject_tag: z.string().optional().default(''),
  category: z.string().optional().default('General'),
  order_index: z.number().optional().default(0),
});

export const profileSchema = z.object({
  name: z.string().optional(),
  college: z.string().optional(),
  semester: z.number().optional(),
  year: z.number().optional(),
  gpa_scale: z.number().optional(),
  focus_goal: z.number().optional(),
  attendance_threshold: z.number().optional(),
  timezone: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  profile_photo_url: z.string().nullable().optional(),
});

export const subjectSchema = z.object({
  student_id: z.string().min(1),
  name: z.string().min(1),
  semester: z.string().optional().default(''),
  professor: z.string().optional().default(''),
  color: z.string().optional().default('#6366f1'),
});

export const settingsSchema = z.object({
  focus_defaults: z.object({
    pomodoro_duration: z.number().min(1).max(120).optional(),
    break_duration: z.number().min(1).max(60).optional(),
    long_break_duration: z.number().min(1).max(60).optional(),
    sessions_before_long_break: z.number().min(1).max(10).optional(),
  }).optional(),
  working_days: z.array(z.number().min(0).max(6)).optional(),
  custom_periods: z.array(z.object({
    name: z.string().min(1),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  timezone: z.string().optional(),
  attendance_threshold: z.number().min(0).max(100).optional(),
  attendance_count_bunks_as_absent: z.boolean().optional(),
});

export const collegeCalendarEventSchema = z.object({
  student_id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['semester', 'exam', 'holiday', 'event']).optional().default('event'),
  start_date: z.string(),
  end_date: z.string().optional().default(''),
  color: z.string().optional().default('#89AACC'),
});

export const topicResourceSchema = z.object({
  topic_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().optional().default(''),
  type: z.enum(['link', 'youtube', 'pdf', 'note', 'tool']).optional().default('link'),
  description: z.string().optional().default(''),
});

export const aiChatSchema = z.object({
  student_id: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  session_id: z.string().optional(),
});
