import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const createUploader = ({ folderPath, fileFilter, fileSize = 5 * 1024 * 1024 }) => {
  fs.mkdirSync(folderPath, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, folderPath);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname || '.bin') || '.bin';
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      cb(null, safeName);
    },
  });

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize,
    },
  });
};

export const propertyImageUpload = createUploader({
  folderPath: path.resolve(__dirname, '../../uploads/properties'),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
});

export const dealDocumentUpload = createUploader({
  folderPath: path.resolve(__dirname, '../../uploads/deals'),
  fileFilter: (_req, _file, cb) => {
    cb(null, true);
  },
  fileSize: 10 * 1024 * 1024,
});
