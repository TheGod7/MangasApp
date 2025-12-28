import { registerAs } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import {
  ALLOWED_ARCHIVE_MIMETYPES,
  ALLOWED_IMAGE_MIMETYPES,
  DEFAULT_UPLOAD_MAX_FIELD_SIZE_MB,
  DEFAULT_UPLOAD_MAX_FILES,
  DEFAULT_UPLOAD_MAX_FILE_SIZE_MB,
  DEFAULT_UPLOAD_MAX_PARTS,
} from './media.constants';
import { mediafileFilterFactory } from './file-filter.factory';

const MB = 1024 * 1024;

export const mediaConfig = registerAs('media', (): MulterOptions => {
  const IMAGE_MIMETYPES =
    process.env.ALLOWED_IMAGE_MIMETYPES || ALLOWED_IMAGE_MIMETYPES;
  const ARCHIVE_MIMETYPES =
    process.env.ALLOWED_ARCHIVE_MIMETYPES || ALLOWED_ARCHIVE_MIMETYPES;

  const allowedMimetypes = [
    ...IMAGE_MIMETYPES.split(','),
    ...ARCHIVE_MIMETYPES.split(','),
  ];

  return {
    storage: memoryStorage(),
    limits: {
      fileSize:
        parseInt(
          process.env.UPLOAD_MAX_FILE_SIZE_MB ||
            DEFAULT_UPLOAD_MAX_FILE_SIZE_MB,
        ) * MB,
      files: parseInt(process.env.UPLOAD_MAX_FILES || DEFAULT_UPLOAD_MAX_FILES),
      fieldSize:
        parseInt(
          process.env.UPLOAD_MAX_FIELD_SIZE_MB ||
            DEFAULT_UPLOAD_MAX_FIELD_SIZE_MB,
        ) * MB,
      parts: parseInt(process.env.UPLOAD_MAX_PARTS || DEFAULT_UPLOAD_MAX_PARTS),
    },
    fileFilter: mediafileFilterFactory(allowedMimetypes),
  };
});
