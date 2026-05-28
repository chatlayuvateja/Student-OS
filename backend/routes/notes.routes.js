import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, noteSchema } from '../middleware/validate.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const notes = await queryWhere('class_notes.json', n => n.student_id === req.params.studentId);
  res.json({ success: true, message: 'Notes fetched', data: notes });
}));

router.get('/note/:id', asyncHandler(async (req, res) => {
  const notes = await readData('class_notes.json');
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Note fetched', data: note });
}));

router.get('/search/:studentId', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const notes = await queryWhere('class_notes.json', n => n.student_id === req.params.studentId);
  if (!q) return res.json({ success: true, message: 'Notes fetched', data: notes });
  const query = q.toLowerCase();
  const filtered = notes.filter(n => 
    (n.title && n.title.toLowerCase().includes(query)) ||
    (n.content && n.content.toLowerCase().includes(query))
  );
  res.json({ success: true, message: 'Search results', data: filtered });
}));

router.post('/', validate(noteSchema), asyncHandler(async (req, res) => {
  const note = await insertOne('class_notes.json', {
    ...req.body,
    word_count: req.body.content ? req.body.content.split(/\s+/).length : 0,
  });
  res.json({ success: true, message: 'Note created', data: note });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.content) {
    updates.word_count = updates.content.split(/\s+/).length;
  }
  const updated = await updateOne('class_notes.json', req.params.id, updates);
  if (!updated) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Note updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('class_notes.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Note deleted', data: deleted });
}));

export default router;
