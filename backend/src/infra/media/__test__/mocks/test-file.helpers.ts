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

/** Unit test: archivo ficticio rápido */
const createUnitTestFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'test.jpg',
    filename: 'test',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    ...overrides,
  }) as Express.Multer.File;

/** Integration test: archivo real de resources */
const createIntegrationTestFile = (fileName: string): Express.Multer.File => {
  const filePath = path.join(__dirname, '..', 'resources', fileName);
  const fileBuffer = fs.readFileSync(filePath);

  const ext = path.extname(fileName).slice(1).toLowerCase();
  const mimeType = extToMime[ext] || 'application/octet-stream';

  return {
    fieldname: 'file',
    originalname: fileName,
    encoding: '7bit',
    filename: fileName.split('.')[0],
    mimetype: mimeType,
    size: fileBuffer.length,
    buffer: fileBuffer,
    destination: '',
    path: filePath,
    stream: Readable.from(fileBuffer),
  };
};

export { createUnitTestFile, createIntegrationTestFile };
