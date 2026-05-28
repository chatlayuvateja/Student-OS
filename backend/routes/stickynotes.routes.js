import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, stickyNoteSchema } from '../middleware/validate.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const notes = await queryWhere('sticky_notes.json', n => n.student_id === req.params.studentId);
  res.json({ success: true, message: 'Sticky notes fetched', data: notes });
}));

router.post('/', validate(stickyNoteSchema), asyncHandler(async (req, res) => {
  const note = await insertOne('sticky_notes.json', req.body);
  res.json({ success: true, message: 'Sticky note created', data: note });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('sticky_notes.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Sticky note updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('sticky_notes.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Sticky note deleted', data: deleted });
}));

export default router;
