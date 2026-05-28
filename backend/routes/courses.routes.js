import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, courseSchema } from '../middleware/validate.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const courses = await queryWhere('courses.json', c => c.student_id === req.params.studentId);
  res.json({ success: true, message: 'Courses fetched', data: courses });
}));

router.post('/', validate(courseSchema), asyncHandler(async (req, res) => {
  const course = await insertOne('courses.json', req.body);
  res.json({ success: true, message: 'Course created', data: course });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('courses.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Course not found', data: null });
  res.json({ success: true, message: 'Course updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('courses.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Course not found', data: null });
  res.json({ success: true, message: 'Course deleted', data: deleted });
}));

export default router;
