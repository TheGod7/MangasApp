import { Request } from 'express';

export const mediafileFilterFactory = (allowedMimetypes: string[]) => {
  return (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (allowedMimetypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Invalid file type ${file.mimetype}. Allowed types are: ${allowedMimetypes.join(
            ', ',
          )}`,
        ),
        false,
      );
    }
  };
};
