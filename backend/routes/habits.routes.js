import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, habitSchema } from '../middleware/validate.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const habits = await queryWhere('habits.json', h => h.student_id === req.params.studentId);
  res.json({ success: true, message: 'Habits fetched', data: habits });
}));

router.post('/', validate(habitSchema), asyncHandler(async (req, res) => {
  const habit = await insertOne('habits.json', req.body);
  res.json({ success: true, message: 'Habit created', data: habit });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('habits.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Habit not found', data: null });
  res.json({ success: true, message: 'Habit updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('habits.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Habit not found', data: null });
  res.json({ success: true, message: 'Habit deleted', data: deleted });
}));

router.post('/:id/complete', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { student_id, note } = req.body;
  const completion = await insertOne('habit_completions.json', {
    habit_id: id,
    student_id,
    completed_date: new Date().toISOString().split('T')[0],
    note: note || '',
  });
  res.json({ success: true, message: 'Habit completed', data: completion });
}));

router.get('/:id/history', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const completions = await queryWhere('habit_completions.json', c => c.habit_id === id);
  res.json({ success: true, message: 'Habit history fetched', data: completions });
}));

export default router;
