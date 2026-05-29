import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, topicResourceSchema } from '../middleware/validate.js';

const router = Router();

// GET /roadmaps/topic/:topicId/resources
router.get('/:topicId/resources', asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const resources = await queryWhere('topic_resources.json', r => r.topic_id === topicId);
  res.json({ success: true, message: 'Topic resources fetched', data: resources });
}));

// POST /roadmaps/topic/:topicId/resources — create a resource
router.post('/:topicId/resources', validate(topicResourceSchema), asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const resource = await insertOne('topic_resources.json', { ...req.body, topic_id: topicId });
  res.json({ success: true, message: 'Topic resource added', data: resource });
}));

// PUT /roadmaps/topic/:topicId/resources/:resourceId — edit a resource
router.put('/:topicId/resources/:resourceId', asyncHandler(async (req, res) => {
  const updated = await updateOne('topic_resources.json', req.params.resourceId, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Topic resource not found', data: null });
  res.json({ success: true, message: 'Topic resource updated', data: updated });
}));

// DELETE /roadmaps/topic/:topicId/resources/:resourceId — delete a resource
router.delete('/:topicId/resources/:resourceId', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('topic_resources.json', req.params.resourceId);
  if (!deleted) return res.status(404).json({ success: false, message: 'Topic resource not found', data: null });
  res.json({ success: true, message: 'Topic resource deleted', data: deleted });
}));

export default router;
