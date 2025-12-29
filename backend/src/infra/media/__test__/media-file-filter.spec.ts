import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { mediaFileFilter } from '../media-file-filter';
import { createUnitTestFile } from './mocks/test-file.helpers';

describe('mediaFileFilter', () => {
  const ALLOWED_MIMETYPES = ['image/png', 'image/jpeg'] as const;
  const INVALID_MIMETYPE = 'application/pdf';

  const mockReq = {} as Request;

  type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

  it('should accept file when mimetype is allowed', () => {
    const fileFilter = mediaFileFilter([...ALLOWED_MIMETYPES]);
    const file = createUnitTestFile({ mimetype: ALLOWED_MIMETYPES[0] });

    const callback: jest.MockedFunction<FileFilterCallback> = jest.fn();

    fileFilter(mockReq, file, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should reject file when mimetype is not allowed', () => {
    const fileFilter = mediaFileFilter([...ALLOWED_MIMETYPES]);
    const file = createUnitTestFile({ mimetype: INVALID_MIMETYPE });

    const callback: jest.MockedFunction<FileFilterCallback> = jest.fn();

    fileFilter(mockReq, file, callback);

    expect(callback).toHaveBeenCalledTimes(1);

    const [error, accepted] = callback.mock.calls[0] as [
      BadRequestException,
      boolean,
    ];

    expect(error).toBeInstanceOf(BadRequestException);
    expect(accepted).toBe(false);
    expect(error.message).toContain('Invalid file type');
  });
});
