import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const defaultUploadDir = isServerless ? path.join('/tmp', 'uploads') : path.resolve(process.cwd(), 'public', 'uploads');
export const UPLOAD_DIR = process.env.UPLOAD_DIR || defaultUploadDir;

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[Storage] Upload directory creation notice:', e);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `priya-care-${cleanName}-${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit for high-res mobile photos
  },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i.test(file.originalname);
    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a valid image (JPEG, PNG, WebP, AVIF, HEIC).'));
    }
  },
});
