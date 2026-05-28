import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { readData, writeData, updateOne } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../data'),
  filename: (req, file, cb) => {
    cb(null, 'profile_photo.jpg');
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /profile/:studentId
router.get('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  let profile = await readData('profile.json');
  if (!profile || !profile.id) {
    profile = {
      id: studentId,
      name: 'Student',
      college: '',
      semester: 1,
      year: 1,
      gpa_scale: 4.0,
      focus_goal: 4,
      attendance_threshold: 75,
      timezone: 'America/New_York',
      subjects: [],
      profile_photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await writeData('profile.json', profile);
  }
  res.json({ success: true, message: 'Profile fetched', data: profile });
}));

// PUT /profile/:studentId
router.put('/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const profile = await updateOne('profile.json', studentId, req.body);
  res.json({ success: true, message: 'Profile updated', data: profile });
}));

// POST /profile/photo
router.post('/photo', upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
  }
  const photoUrl = `/data/profile_photo.jpg?t=${Date.now()}`;
  let profile = await readData('profile.json');
  if (profile && profile.id) {
    profile.profile_photo_url = photoUrl;
    profile.updated_at = new Date().toISOString();
    await writeData('profile.json', profile);
  }
  res.json({ success: true, message: 'Profile photo updated', data: { profile_photo_url: photoUrl } });
}));

export default router;
