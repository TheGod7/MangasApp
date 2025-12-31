import { Writable } from 'stream';
import {
  CloudinaryAdminDeleteResponse,
  CreateDeleteResourcesMockOptions,
  CreateUploadStreamMockOptions,
} from '../../types/cloudinary.types';
import { CLOUDINARY_ERRORS } from '../../constants/cloudinary.errors';
import {
  CLOUDINARY_DELETED,
  CLOUDINARY_OK,
  DEFOULT_PUBLICID,
  JPG_EXT,
  URL_PREFIX,
} from './cloudinary.mock.constants';

const CreateUploadStreamMock = (options: CreateUploadStreamMockOptions) => {
  let callIndex = 0;
  const shouldGenerate = options.generateUrl !== false;

  return jest.fn((_config: any, callback: (err: any, result: any) => void) => {
    const writable = new Writable({
      write(_chunk, _encoding, next) {
        if (options.ErrorOnUpload) {
          callback(new Error(CLOUDINARY_ERRORS.UPLOAD_FAILED), null);
          return next();
        }

        if (options.ErrorOnPipe) return next();

        const currentPublicId =
          options.publicIds?.[callIndex] ??
          options.publicId ??
          DEFOULT_PUBLICID + callIndex;

        let finalUrl: string | undefined;

        if (options.fixedUrl) {
          finalUrl = options.fixedUrl;
        } else if (shouldGenerate) {
          finalUrl = URL_PREFIX + currentPublicId + JPG_EXT;
        }

        const response = {
          public_id: currentPublicId,
          ...(finalUrl && { secure_url: finalUrl }),
        };

        callback(null, response);
        callIndex++;
        next();
      },
    });

    if (options.ErrorOnPipe) {
      writable.on('pipe', (src: NodeJS.ReadableStream) => {
        process.nextTick(() =>
          src.emit('error', new Error(CLOUDINARY_ERRORS.UPLOAD_FAILED)),
        );
      });
    }

    return writable;
  });
};

const CreateDeleteResourcesMock = (
  options: CreateDeleteResourcesMockOptions = {},
) => {
  return jest.fn(
    (publicIds: string[]): Promise<CloudinaryAdminDeleteResponse> => {
      if (options.errorOnDelete) {
        return Promise.reject(new Error(CLOUDINARY_ERRORS.DELETE_FAILED));
      }

      const defaultStatus = options.defaultStatus ?? CLOUDINARY_DELETED;

      const deleted = publicIds.reduce<Record<string, string>>((acc, id) => {
        acc[id] = options.customStatuses?.[id] ?? defaultStatus;
        return acc;
      }, {});

      return Promise.resolve({
        deleted,
        partial: false,
      });
    },
  );
};

const mockCloudinary = {
  uploader: {
    upload_stream: CreateUploadStreamMock({}),
    destroy: jest.fn((_id, callback: (err: any, result: any) => void) => {
      callback(null, { result: CLOUDINARY_OK });
    }),
  },
  api: {
    delete_resources: CreateDeleteResourcesMock(),
    resource: jest.fn((publicId: string) => {
      return Promise.resolve({
        public_id: publicId,
        secure_url: URL_PREFIX + publicId + JPG_EXT,
      });
    }),
  },
};

export { mockCloudinary, CreateUploadStreamMock, CreateDeleteResourcesMock };
