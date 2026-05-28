import { Router } from 'express';
import { readData, insertOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, focusSessionSchema } from '../middleware/validate.js';

const router = Router();

router.post('/session', validate(focusSessionSchema), asyncHandler(async (req, res) => {
  const session = await insertOne('focus_sessions.json', req.body);
  res.json({ success: true, message: 'Focus session logged', data: session });
}));

router.get('/:studentId', asyncHandler(async (req, res) => {
  const sessions = await queryWhere('focus_sessions.json', s => s.student_id === req.params.studentId);
  res.json({ success: true, message: 'Focus sessions fetched', data: sessions });
}));

router.get('/report/weekly/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const sessions = await queryWhere('focus_sessions.json', s => s.student_id === studentId);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekly = sessions.filter(s => new Date(s.date || s.created_at) >= weekAgo);
  res.json({ success: true, message: 'Weekly report fetched', data: weekly });
}));

router.get('/report/monthly/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const sessions = await queryWhere('focus_sessions.json', s => s.student_id === studentId);
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const monthly = sessions.filter(s => new Date(s.date || s.created_at) >= monthAgo);
  res.json({ success: true, message: 'Monthly report fetched', data: monthly });
}));

router.get('/report/yearly/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const sessions = await queryWhere('focus_sessions.json', s => s.student_id === studentId);
  const now = new Date();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const yearly = sessions.filter(s => new Date(s.date || s.created_at) >= yearAgo);
  res.json({ success: true, message: 'Yearly report fetched', data: yearly });
}));

export default router;
