import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const mediaFileFilter = (allowedMimetypes: string[]) => {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (allowedMimetypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(
          `Invalid file type ${file.mimetype}. Allowed types are: ${allowedMimetypes.join(', ')}`,
        ),
        false,
      );
    }
  };
};
