import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const UPLOAD_DIR = path.join(process.cwd(), '.uploads');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

// Configure multer with disk storage to avoid memory exhaustion for large files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    cb(null, `${fileId}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

// POST /api/upload - Upload file (disk storage to avoid memory issues)
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // File is already saved to disk by multer
    const stat = await fs.stat(req.file.path);
    const fileId = req.file.filename.split('-')[0]; // Extract ID from filename

    const uploadedFile: UploadedFile = {
      id: fileId,
      name: req.file.originalname,
      size: stat.size,
      uploadedAt: new Date().toISOString(),
    };

    return res.status(201).json(uploadedFile);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Upload failed' });
  }
});

// GET /api/files - List uploaded files
router.get('/files', async (_req: Request, res: Response) => {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(UPLOAD_DIR, file);
        const stat = await fs.stat(filePath);
        return {
          name: file,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
    );
    return res.json(fileStats);
  } catch (error) {
    return res.json({ files: [] });
  }
});

// DELETE /api/files/:id - Delete file
router.delete('/files/:id', async (req: Request, res: Response) => {
  try {
    const fileId = req.params.id;
    const files = await fs.readdir(UPLOAD_DIR);
    const fileToDelete = files.find((f) => f.startsWith(fileId));

    if (!fileToDelete) {
      return res.status(404).json({ message: 'File not found' });
    }

    await fs.unlink(path.join(UPLOAD_DIR, fileToDelete));
    return res.json({ message: 'File deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
