import { Router } from 'express';
import { readData, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/calculate/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const courses = await queryWhere('courses.json', c => c.student_id === studentId);
  const semesters = await queryWhere('semesters.json', s => s.student_id === studentId);
  
  let totalCredits = 0;
  let totalGradePoints = 0;
  
  courses.forEach(c => {
    totalCredits += c.credit_hours || 0;
    totalGradePoints += (c.credit_hours || 0) * (c.grade_points || 0);
  });
  
  const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits) : 0;
  
  res.json({
    success: true,
    message: 'CGPA calculated',
    data: {
      gpa: Math.round(gpa * 100) / 100,
      totalCredits,
      totalCourses: courses.length,
      courses,
      semesters,
    }
  });
}));

export default router;
