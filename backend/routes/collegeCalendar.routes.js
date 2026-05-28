import { Router } from 'express';
import { insertOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/:studentId', asyncHandler(async (req, res) => {
  const events = await queryWhere('college_calendar.json', e => e.student_id === req.params.studentId);
  res.json({ success: true, message: 'Calendar events fetched', data: events });
}));

router.post('/', asyncHandler(async (req, res) => {
  const event = await insertOne('college_calendar.json', req.body);
  res.json({ success: true, message: 'Calendar event created', data: event });
}));

export default router;
