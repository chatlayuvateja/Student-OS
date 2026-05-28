import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, attendanceSchema } from '../middleware/validate.js';

const router = Router();

router.get('/summary/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const records = await queryWhere('attendance_records.json', r => r.student_id === studentId);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const leave = records.filter(r => r.status === 'leave').length;
  const percentage = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;
  res.json({
    success: true, message: 'Attendance summary',
    data: { total, present, absent, leave, percentage, records }
  });
}));

router.get('/subject/:subjectId', asyncHandler(async (req, res) => {
  const records = await queryWhere('attendance_records.json', r => r.subject_id === req.params.subjectId);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const percentage = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;
  res.json({ success: true, message: 'Subject attendance', data: { total, present, percentage, records } });
}));

router.get('/leave-impact', asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.query;
  const records = await queryWhere('attendance_records.json', r => r.student_id === studentId && r.subject_id === subjectId);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const currentPct = total > 0 ? (present / total) * 100 : 0;
  const newPct = (total + 1) > 0 ? (present / (total + 1)) * 100 : 0;
  res.json({
    success: true, message: 'Leave impact calculated',
    data: { currentPercentage: currentPct, newPercentage: newPct, delta: newPct - currentPct, currentTotal: total }
  });
}));

router.post('/mark', validate(attendanceSchema), asyncHandler(async (req, res) => {
  const record = await insertOne('attendance_records.json', req.body);
  res.json({ success: true, message: 'Attendance marked', data: record });
}));

export default router;
