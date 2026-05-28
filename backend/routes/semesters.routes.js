import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const semesters = await queryWhere('semesters.json', s => s.student_id === req.params.studentId);
  res.json({ success: true, message: 'Semesters fetched', data: semesters });
}));

router.post('/', asyncHandler(async (req, res) => {
  const semester = await insertOne('semesters.json', req.body);
  res.json({ success: true, message: 'Semester created', data: semester });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('semesters.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Semester not found', data: null });
  res.json({ success: true, message: 'Semester updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('semesters.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Semester not found', data: null });
  res.json({ success: true, message: 'Semester deleted', data: deleted });
}));

export default router;
