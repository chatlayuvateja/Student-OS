import { Router } from 'express';
import { readData, writeData } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, settingsSchema } from '../middleware/validate.js';

const router = Router();

// GET /settings/:studentId
router.get('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  let settings = await readData('settings.json');

  // If no settings exist, return defaults
  if (!settings || settings.student_id !== studentId) {
    settings = {
      student_id: studentId,
      focus_defaults: {
        pomodoro_duration: 25,
        break_duration: 5,
        long_break_duration: 15,
        sessions_before_long_break: 4,
      },
      working_days: [0, 1, 2, 3, 4, 5, 6], // 0=Sun, 6=Sat
      custom_periods: [],
      timezone: 'America/New_York',
      attendance_threshold: 75,
      attendance_count_bunks_as_absent: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await writeData('settings.json', settings);
  }

  res.json({ success: true, message: 'Settings fetched', data: settings });
}));

// PUT /settings/:studentId
router.put('/:studentId', validate(settingsSchema), asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  let settings = await readData('settings.json');

  if (settings && settings.student_id === studentId) {
    // Deep merge for nested objects like focus_defaults
    if (req.body.focus_defaults && settings.focus_defaults) {
      req.body.focus_defaults = { ...settings.focus_defaults, ...req.body.focus_defaults };
    }
    Object.assign(settings, req.body, {
      student_id: studentId,
      updated_at: new Date().toISOString(),
    });
  } else {
    settings = {
      ...req.body,
      student_id: studentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  await writeData('settings.json', settings);
  res.json({ success: true, message: 'Settings updated', data: settings });
}));

export default router;
