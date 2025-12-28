import { Writable } from 'stream';
import { CLOUDINARY_ERRORS } from '../../constants/cloudinary.errors';

interface CreateUploadStreamMockOptions {
  secureUrl?: string | null;
  Urls?: string[];

  MultipleUploads?: boolean;
  ErrorOnpipe?: boolean;
  ErrorOnUpload?: boolean;
}

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
            cloudinaryCallback(new Error(CLOUDINARY_ERRORS.TEST_ERROR), null);
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

const mockCloudinary = {
  uploader: {
    upload_stream: CreateUploadStreamMock({
      secureUrl: 'https://example.com/image.jpg',
    }),
    destroy: jest.fn(),
  },
  url: jest.fn(),
};

export { mockCloudinary, CreateUploadStreamMock };
