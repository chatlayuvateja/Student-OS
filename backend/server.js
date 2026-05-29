import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import profileRoutes from './routes/profile.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import habitsRoutes from './routes/habits.routes.js';
import focusRoutes from './routes/focus.routes.js';
import notesRoutes from './routes/notes.routes.js';
import stickyNotesRoutes from './routes/stickynotes.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import semestersRoutes from './routes/semesters.routes.js';
import cgpaRoutes from './routes/cgpa.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import resourcesRoutes from './routes/resources.routes.js';
import aiRoutes from './routes/ai.routes.js';
import backupRoutes from './routes/backup.routes.js';
import collegeCalendarRoutes from './routes/collegeCalendar.routes.js';
import attendanceSettingsRoutes from './routes/attendanceSettings.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import subjectsRoutes from './routes/subjects.routes.js';
import topicResourcesRoutes from './routes/topicResources.routes.js';
import workingDaysRoutes from './routes/workingDays.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginEmbedderPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from /data for profile photos
app.use('/data', express.static(path.resolve(__dirname, '../data')));

// Routes
app.use('/profile', profileRoutes);
app.use('/timetable', timetableRoutes);
app.use('/habits', habitsRoutes);
app.use('/focus', focusRoutes);
app.use('/notes', notesRoutes);
app.use('/stickynotes', stickyNotesRoutes);
app.use('/courses', coursesRoutes);
app.use('/semesters', semestersRoutes);
app.use('/cgpa', cgpaRoutes);
app.use('/roadmaps', roadmapRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/college-calendar', collegeCalendarRoutes);
app.use('/attendance-settings', attendanceSettingsRoutes);
app.use('/resources', resourcesRoutes);
app.use('/ai', aiRoutes);
app.use('/settings', settingsRoutes);
app.use('/subjects', subjectsRoutes);
app.use('/roadmaps/topic', topicResourcesRoutes);
app.use('/working-days', workingDaysRoutes);
app.use('/backup', backupRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Student OS API is running', data: { uptime: process.uptime() } });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎓 Student OS API running on http://localhost:${PORT}`);
});

export default app;
