import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Roadmap CRUD
router.get('/:studentId', asyncHandler(async (req, res) => {
  const roadmaps = await queryWhere('roadmaps.json', r => r.student_id === req.params.studentId);
  const topics = await readData('roadmap_topics.json');
  const data = roadmaps.map(rm => ({
    ...rm,
    topics: topics.filter(t => t.roadmap_id === rm.id),
  }));
  res.json({ success: true, message: 'Roadmaps fetched', data });
}));

router.post('/', asyncHandler(async (req, res) => {
  const roadmap = await insertOne('roadmaps.json', req.body);
  res.json({ success: true, message: 'Roadmap created', data: roadmap });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('roadmaps.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Roadmap not found', data: null });
  res.json({ success: true, message: 'Roadmap updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('roadmaps.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Roadmap not found', data: null });
  res.json({ success: true, message: 'Roadmap deleted', data: deleted });
}));

// Topics
router.post('/:id/topic', asyncHandler(async (req, res) => {
  const topic = await insertOne('roadmap_topics.json', { ...req.body, roadmap_id: req.params.id });
  res.json({ success: true, message: 'Topic created', data: topic });
}));

router.put('/topic/:topicId', asyncHandler(async (req, res) => {
  const updated = await updateOne('roadmap_topics.json', req.params.topicId, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Topic not found', data: null });
  res.json({ success: true, message: 'Topic updated', data: updated });
}));

router.delete('/topic/:topicId', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('roadmap_topics.json', req.params.topicId);
  if (!deleted) return res.status(404).json({ success: false, message: 'Topic not found', data: null });
  res.json({ success: true, message: 'Topic deleted', data: deleted });
}));

router.post('/:id/topic/:topicId/complete', asyncHandler(async (req, res) => {
  const updated = await updateOne('roadmap_topics.json', req.params.topicId, { is_completed: true, completed_at: new Date().toISOString() });
  if (!updated) return res.status(404).json({ success: false, message: 'Topic not found', data: null });
  res.json({ success: true, message: 'Topic completed', data: updated });
}));

export default router;
