import { Router } from 'express';
import { readData, writeData } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

function getDefaultConfig(studentId) {
  return {
    student_id: studentId,
    working_days: [1, 2, 3, 4, 5],
    holidays: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// GET /working-days/:studentId
router.get('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  let config;
  try {
    config = await readData('working_days_config.json');
  } catch {
    config = null;
  }
  if (!config || config.student_id !== studentId) {
    config = getDefaultConfig(studentId);
    await writeData('working_days_config.json', config);
  }
  res.json({ success: true, message: 'Working days config fetched', data: config });
}));

// PUT /working-days/:studentId  (update working_days array)
router.put('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { working_days } = req.body;
  if (!Array.isArray(working_days)) {
    return res.status(400).json({ success: false, message: 'working_days must be an array', data: null });
  }
  let config;
  try {
    config = await readData('working_days_config.json');
  } catch {
    config = null;
  }
  if (!config || config.student_id !== studentId) {
    config = getDefaultConfig(studentId);
  }
  config.working_days = working_days;
  config.updated_at = new Date().toISOString();
  await writeData('working_days_config.json', config);
  res.json({ success: true, message: 'Working days updated', data: config });
}));

// POST /working-days/:studentId/holiday  (add a holiday)
router.post('/:studentId/holiday', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { date, reason } = req.body;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date is required', data: null });
  }
  let config;
  try {
    config = await readData('working_days_config.json');
  } catch {
    config = null;
  }
  if (!config || config.student_id !== studentId) {
    config = getDefaultConfig(studentId);
  }
  // Avoid duplicates
  const existing = config.holidays.find(h => h.date === date);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Holiday already exists for this date', data: null });
  }
  config.holidays.push({ date, reason: reason || '' });
  config.updated_at = new Date().toISOString();
  await writeData('working_days_config.json', config);
  res.json({ success: true, message: 'Holiday added', data: config });
}));

// DELETE /working-days/:studentId/holiday/:date  (remove a holiday)
router.delete('/:studentId/holiday/:date', asyncHandler(async (req, res) => {
  const { studentId, date } = req.params;
  let config;
  try {
    config = await readData('working_days_config.json');
  } catch {
    config = null;
  }
  if (!config || config.student_id !== studentId) {
    return res.status(404).json({ success: false, message: 'Config not found', data: null });
  }
  const initialLength = config.holidays.length;
  config.holidays = config.holidays.filter(h => h.date !== date);
  if (config.holidays.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Holiday not found', data: null });
  }
  config.updated_at = new Date().toISOString();
  await writeData('working_days_config.json', config);
  res.json({ success: true, message: 'Holiday removed', data: config });
}));

export default router;
