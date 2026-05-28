import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, timetableSchema } from '../middleware/validate.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const timetable = await queryWhere('timetable.json', t => t.student_id === studentId);
  res.json({ success: true, message: 'Timetable fetched', data: timetable });
}));

router.get('/:studentId/day/:dayOfWeek', asyncHandler(async (req, res) => {
  const { studentId, dayOfWeek } = req.params;
  const timetable = await queryWhere('timetable.json', t => t.student_id === studentId && t.day_of_week === parseInt(dayOfWeek));
  res.json({ success: true, message: 'Day schedule fetched', data: timetable });
}));

router.post('/', validate(timetableSchema), asyncHandler(async (req, res) => {
  const entry = await insertOne('timetable.json', req.body);
  res.json({ success: true, message: 'Timetable entry created', data: entry });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('timetable.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Entry not found', data: null });
  res.json({ success: true, message: 'Timetable entry updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('timetable.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Entry not found', data: null });
  res.json({ success: true, message: 'Timetable entry deleted', data: deleted });
}));

export default router;
