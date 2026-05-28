import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, resourceSchema } from '../middleware/validate.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const resources = await queryWhere('resources.json', r => r.student_id === req.params.studentId);
  const categories = await readData('resource_categories.json');
  res.json({ success: true, message: 'Resources fetched', data: { resources, categories } });
}));

router.post('/', validate(resourceSchema), asyncHandler(async (req, res) => {
  const resource = await insertOne('resources.json', req.body);
  res.json({ success: true, message: 'Resource created', data: resource });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('resources.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Resource not found', data: null });
  res.json({ success: true, message: 'Resource updated', data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('resources.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Resource not found', data: null });
  res.json({ success: true, message: 'Resource deleted', data: deleted });
}));

// Categories
router.post('/category', asyncHandler(async (req, res) => {
  const category = await insertOne('resource_categories.json', req.body);
  res.json({ success: true, message: 'Category created', data: category });
}));

export default router;
