import { Router } from 'express';
import { insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, subjectSchema } from '../middleware/validate.js';

const router = Router();

// GET /subjects/:studentId
router.get('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const subjects = await queryWhere('subjects.json', s => s.student_id === studentId);
  res.json({ success: true, message: 'Subjects fetched', data: subjects });
}));

// POST /subjects
router.post('/', validate(subjectSchema), asyncHandler(async (req, res) => {
  const subject = await insertOne('subjects.json', req.body);
  res.json({ success: true, message: 'Subject added', data: subject });
}));

// PUT /subjects/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('subjects.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Subject not found', data: null });
  res.json({ success: true, message: 'Subject updated', data: updated });
}));

// DELETE /subjects/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('subjects.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Subject not found', data: null });
  res.json({ success: true, message: 'Subject deleted', data: deleted });
}));

export default router;
