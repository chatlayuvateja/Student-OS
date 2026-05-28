import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { readData, insertOne, updateOne, deleteOne, queryWhere } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// File upload storage — saves to /data/notes_files/
const NOTES_DIR = path.resolve(__dirname, '../../data/notes_files');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.mkdir(NOTES_DIR, { recursive: true });
    cb(null, NOTES_DIR);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const allowedTypes = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PPT, PPTX, DOC, DOCX files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /notes/:studentId
router.get('/:studentId', asyncHandler(async (req, res) => {
  const notes = await queryWhere('class_notes.json', n => n.student_id === req.params.studentId);
  res.json({ success: true, message: 'Notes fetched', data: notes });
}));

// GET /notes/note/:id
router.get('/note/:id', asyncHandler(async (req, res) => {
  const notes = await readData('class_notes.json');
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Note fetched', data: note });
}));

// GET /notes/search/:studentId
router.get('/search/:studentId', asyncHandler(async (req, res) => {
  const { q } = req.query;
  const notes = await queryWhere('class_notes.json', n => n.student_id === req.params.studentId);
  if (!q) return res.json({ success: true, message: 'Notes fetched', data: notes });
  const query = q.toLowerCase();
  const filtered = notes.filter(n =>
    (n.title && n.title.toLowerCase().includes(query)) ||
    (n.subject && n.subject.toLowerCase().includes(query))
  );
  res.json({ success: true, message: 'Search results', data: filtered });
}));

// POST /notes — typed note (existing)
router.post('/', asyncHandler(async (req, res) => {
  const note = await insertOne('class_notes.json', {
    ...req.body,
    note_type: 'text',
    word_count: req.body.content ? req.body.content.split(/\s+/).length : 0,
  });
  res.json({ success: true, message: 'Note created', data: note });
}));

// POST /notes/upload — file upload (NEW)
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
  }

  const { title, subject, tags, student_id } = req.body;

  // Determine file type label
  const ext = path.extname(req.file.originalname).toLowerCase();
  const typeMap = { '.pdf': 'PDF', '.ppt': 'PPT', '.pptx': 'PPTX', '.doc': 'DOC', '.docx': 'DOCX' };
  const fileTypeLabel = typeMap[ext] || 'FILE';

  const note = await insertOne('class_notes.json', {
    student_id: student_id || 'student-1',
    title: title || req.file.originalname,
    subject: subject || '',
    tags_array: tags ? tags.split(',').map(t => t.trim()) : [],
    note_type: 'file',
    file_url: `/data/notes_files/${req.file.filename}`,
    file_original_name: req.file.originalname,
    file_size_bytes: req.file.size,
    file_type: fileTypeLabel,
    content: '',
    word_count: 0,
  });

  res.json({ success: true, message: 'File note uploaded', data: note });
}));

// PUT /notes/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await updateOne('class_notes.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Note not found', data: null });
  res.json({ success: true, message: 'Note updated', data: updated });
}));

// DELETE /notes/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await deleteOne('class_notes.json', req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Note not found', data: null });

  // Also delete the physical file if it was a file note
  if (deleted.file_url) {
    const filePath = path.resolve(__dirname, '../../data/notes_files', path.basename(deleted.file_url));
    try { await fs.unlink(filePath); } catch (_) { /* ignore if already gone */ }
  }

  res.json({ success: true, message: 'Note deleted', data: deleted });
}));

export default router;
