import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
// Uploaded files stored under .uploads (add to .gitignore to avoid committing user files)
const UPLOAD_DIR = path.join(process.cwd(), '.uploads');

// Ensure upload directory exists - fail loudly if it can't be created
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error(`Failed to create upload directory ${UPLOAD_DIR}:`, error);
    process.exit(1);
  }
})();

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

    // Sanitize filename to prevent path traversal
    const originalBaseName = path.basename(req.file.originalname);
    const sanitizedName = originalBaseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'file';
    const fileId = uuidv4();
    const finalFilename = `${fileId}-${sanitizedName}`;

    // File is already saved to disk by multer, but rename it to sanitized name
    const tempPath = req.file.path;
    const finalPath = path.join(UPLOAD_DIR, finalFilename);
    await fs.rename(tempPath, finalPath);

    const stat = await fs.stat(finalPath);
    const uploadedFile: UploadedFile = {
      id: fileId,
      name: sanitizedName,
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
        // Extract ID and original name from filename (format: {id}-{original})
        const firstDash = file.indexOf('-');
        const id = firstDash > 0 ? file.slice(0, firstDash) : file;
        const name = firstDash > 0 ? file.slice(firstDash + 1) : file;
        return {
          id,
          name,
          size: stat.size,
          uploadedAt: stat.mtime.toISOString(),
        };
      })
    );
    return res.json(fileStats);
  } catch (error) {
    return res.status(500).json([]);
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
