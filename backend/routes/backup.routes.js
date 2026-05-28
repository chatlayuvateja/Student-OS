import { Router } from 'express';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { writeData } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const dataDir = path.resolve(__dirname, '../../data');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=student-os-backup.zip');
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  archive.directory(dataDir, false);
  await archive.finalize();
}));

router.delete('/reset/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const { confirm } = req.body;
  
  if (confirm !== `reset-${filename}`) {
    return res.status(400).json({ success: false, message: 'Invalid confirmation', data: null });
  }
  
  const empty = filename.includes('profile') || filename.includes('settings') ? {} : [];
  await writeData(filename, empty);
  res.json({ success: true, message: `Data reset for ${filename}`, data: null });
}));

export default router;
