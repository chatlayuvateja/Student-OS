import { Router } from 'express';
import { readData, writeData } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const settings = await readData('attendance_settings.json');
  const data = settings && settings.student_id === req.params.studentId
    ? settings
    : { student_id: req.params.studentId, minimum_threshold: 75, count_leaves_as_absent: false };
  res.json({ success: true, message: 'Settings fetched', data });
}));

router.put('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  let settings = await readData('attendance_settings.json');
  if (settings && settings.student_id === studentId) {
    Object.assign(settings, req.body, { updated_at: new Date().toISOString() });
  } else {
    settings = { ...req.body, student_id: studentId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }
  await writeData('attendance_settings.json', settings);
  res.json({ success: true, message: 'Settings updated', data: settings });
}));

export default router;
