import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const extToMime: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  zip: 'application/zip',
};

export const createMulterFileMock = (fileName: string): Express.Multer.File => {
  const filePath = path.join(__dirname, '..', 'resources', fileName);
  const fileBuffer = fs.readFileSync(filePath);

  const ext = path.extname(fileName).slice(1).toLowerCase();
  const mimeType = extToMime[ext] || 'application/octet-stream';

  return {
    fieldname: 'file',
    originalname: fileName,
    encoding: '7bit',
    mimetype: mimeType,
    size: fileBuffer.length,
    buffer: fileBuffer,
    destination: '',
    filename: fileName,
    path: filePath,
    stream: Readable.from(fileBuffer),
  };
};
