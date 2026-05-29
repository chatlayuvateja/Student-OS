import { Router } from 'express';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, attendanceSchema } from '../middleware/validate.js';

const router = Router();

router.get('/summary/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  // Fetch current timetable entries to get active slot IDs
  const timetable = await queryWhere('timetable.json', t => t.student_id === studentId);
  const activeSlotIds = new Set(timetable.map(t => t.id));

  // Fetch working days config to exclude holidays and non-working days
  let workingDaysConfig = { working_days: [1, 2, 3, 4, 5], holidays: [] };
  try {
    workingDaysConfig = await readData('working_days_config.json');
  } catch {}
  if (workingDaysConfig.student_id !== studentId) {
    workingDaysConfig = { working_days: [1, 2, 3, 4, 5], holidays: [] };
  }
  const workingDays = new Set(workingDaysConfig.working_days || [1, 2, 3, 4, 5]);
  const holidayDates = new Set((workingDaysConfig.holidays || []).map(h => h.date));

  const allRecords = await queryWhere('attendance_records.json', r => r.student_id === studentId);
  // Exclude records on non-working days, holidays, and records whose timetable_slot_id no longer exists
  const records = allRecords.filter(r => {
    const d = new Date(r.date);
    const dayOfWeek = d.getDay();
    // Exclude non-working days
    if (!workingDays.has(dayOfWeek)) return false;
    // Exclude holidays
    if (holidayDates.has(r.date)) return false;
    // Only count records linked to current timetable entries
    if (r.timetable_slot_id && !activeSlotIds.has(r.timetable_slot_id)) return false;
    return true;
  });
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent' || r.status === 'bunk').length;
  const leave = records.filter(r => r.status === 'leave').length;
  const percentage = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;
  res.json({
    success: true, message: 'Attendance summary',
    data: { total, present, absent, leave, percentage, records }
  });
}));

router.get('/subject/:subjectId', asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const records = await queryWhere('attendance_records.json', r => r.subject_id === subjectId);
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const percentage = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;
  res.json({ success: true, message: 'Subject attendance', data: { total, present, percentage, records } });
}));

router.get('/leave-impact', asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.query;

  // Fetch working days config
  let workingDaysConfig = { working_days: [1, 2, 3, 4, 5], holidays: [] };
  try {
    workingDaysConfig = await readData('working_days_config.json');
  } catch {}
  if (workingDaysConfig.student_id !== studentId) {
    workingDaysConfig = { working_days: [1, 2, 3, 4, 5], holidays: [] };
  }
  const workingDays = new Set(workingDaysConfig.working_days || [1, 2, 3, 4, 5]);
  const holidayDates = new Set((workingDaysConfig.holidays || []).map(h => h.date));

  const allRecords = await queryWhere('attendance_records.json', r => r.student_id === studentId && r.subject_id === subjectId);
  // Exclude non-working days and holidays
  const records = allRecords.filter(r => {
    const d = new Date(r.date);
    const dayOfWeek = d.getDay();
    if (!workingDays.has(dayOfWeek)) return false;
    if (holidayDates.has(r.date)) return false;
    return true;
  });
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const currentPct = total > 0 ? (present / total) * 100 : 0;
  const newPct = (total + 1) > 0 ? (present / (total + 1)) * 100 : 0;
  res.json({
    success: true, message: 'Leave impact calculated',
    data: { currentPercentage: currentPct, newPercentage: newPct, delta: newPct - currentPct, currentTotal: total }
  });
}));

router.post('/mark', validate(attendanceSchema), asyncHandler(async (req, res) => {
  const record = await insertOne('attendance_records.json', req.body);
  res.json({ success: true, message: 'Attendance marked', data: record });
}));

export default router;
