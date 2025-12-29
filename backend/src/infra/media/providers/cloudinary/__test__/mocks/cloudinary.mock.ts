import { Writable } from 'stream';
import {
  CloudinaryAdminDeleteResponse,
  CreateDeleteResourcesMockOptions,
  CreateUploadStreamMockOptions,
} from '../../types/cloudinary.types';
import { CLOUDINARY_ERRORS } from '../../constants/cloudinary.errors';

const CreateUploadStreamMock = (options: CreateUploadStreamMockOptions) => {
  let callIndex = 0;

  return jest.fn(
    (
      _optionsInner: any,
      cloudinaryCallback: (err: any, result: any) => void,
    ) => {
      let called = false;

      const writable = new Writable({
        write(_chunk, _encoding, done) {
          if (options.ErrorOnUpload) {
            cloudinaryCallback(new Error(), null);
          }

          if (
            !options.ErrorOnUpload &&
            !options.ErrorOnpipe &&
            !options.MultipleUploads
          ) {
            cloudinaryCallback(null, {
              secure_url: options.secureUrl,
            });
          }

          done();
        },

        final(done) {
          if (options.MultipleUploads && !called) {
            cloudinaryCallback(null, {
              secure_url:
                options.Urls?.[callIndex++] ??
                options.Urls?.[options.Urls.length - 1],
            });

            called = true;
          }

          done();
        },
      });

      if (options.ErrorOnpipe) {
        writable.on('pipe', (src: NodeJS.ReadableStream) => {
          src.on('error', (err: Error) => {
            cloudinaryCallback(err, null);
            writable.emit('error', err);
          });
        });

        writable.on('error', (err) => {
          cloudinaryCallback(err, null);
        });
      }

      return writable;
    },
  );
};

const CreateDeleteResourcesMock = (
  options: CreateDeleteResourcesMockOptions = {},
) => {
  return jest.fn(
    (publicIds: string[]): Promise<CloudinaryAdminDeleteResponse> => {
      if (options.errorOnDelete) {
        return Promise.reject(new Error(CLOUDINARY_ERRORS.DELETE_FAILED));
      }

      const defaultStatus = options.defaultStatus ?? 'deleted';

      const deleted = publicIds.reduce((acc, id) => {
        const status = options.customStatuses?.[id] ?? defaultStatus;
        return { ...acc, [id]: status };
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
    upload_stream: CreateUploadStreamMock({
      secureUrl: 'https://example.com/image.jpg',
    }),
    destroy: jest.fn((_id, callback: (err: any, result: any) => void) => {
      callback(null, { result: 'ok' });
    }),
  },
  api: {
    delete_resources: CreateDeleteResourcesMock(),
  },
  url: jest.fn(),
};

export { mockCloudinary, CreateUploadStreamMock, CreateDeleteResourcesMock };
