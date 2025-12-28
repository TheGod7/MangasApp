import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary.service';
import { CLOUDINARY } from '../constants/cloudinary.constants';
import { Readable, Writable } from 'stream';
import { CLOUDINARY_ERRORS } from '../constants/cloudinary.errors';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const createFile = (
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

  const mockCloudinary = {
    uploader: {
      upload_stream: jest.fn(
        (_options, cloudinaryCallback: (err: any, result: any) => void) => {
          return new Writable({
            write(_chunk, _encoding, done) {
              cloudinaryCallback(null, {
                secure_url: 'https://example.com/image.jpg',
              });

              done();
            },
          });
        },
      ),
      destroy: jest.fn(),
    },
    url: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: CLOUDINARY,
          useValue: mockCloudinary,
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  describe('upload', () => {
    it('Should upload a file to cloudinary', async () => {
      const file = createFile({ filename: 'test.jpg' });
      const url = await service.upload(file);

      expect(url).toBe('https://example.com/image.jpg');
      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should throw if cloudinary upload fails', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementationOnce(
        (_options, callback) => {
          return new Writable({
            write(_chunk, _encoding, done) {
              callback(new Error(CLOUDINARY_ERRORS.TEST_ERROR), null);
              done();
            },
          });
        },
      );

      const file = createFile({ filename: 'test.jpg' });

      const uploadPromise = service.upload(file);

      await expect(uploadPromise).rejects.toThrow(CLOUDINARY_ERRORS.TEST_ERROR);
    });

    it('should throw if no secure_url is returned', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementationOnce(
        (_options, callback) => {
          return new Writable({
            write(_chunk, _encoding, done) {
              callback(null, { secure_url: null });
              done();
            },
          });
        },
      );

      const file = createFile({ filename: 'test.jpg' });
      const uploadPromise = service.upload(file);

      await expect(uploadPromise).rejects.toThrow(
        CLOUDINARY_ERRORS.NO_SECURE_URL,
      );
    });

    it('should throw if file buffer is empty', async () => {
      const file = createFile({ buffer: Buffer.from('') });

      const uploadPromise = service.upload(file);

      await expect(uploadPromise).rejects.toThrow(
        CLOUDINARY_ERRORS.BUFFER_EMPTY,
      );
    });

    it('should reject if the readable stream emits an error (pipe error)', async () => {
      mockCloudinary.uploader.upload_stream.mockImplementationOnce(() => {
        const writable = new Writable({
          write(_chunk, _encoding, done) {
            done();
          },
        });

        writable.on('pipe', (src: Readable) => {
          src.on('error', (err: Error) => {
            writable.emit('error', err);
          });
        });

        return writable;
      });

      const file = createFile();

      // eslint-disable-next-line @typescript-eslint/unbound-method
      const originalFrom = Readable.from;

      const fromSpy = jest
        .spyOn(Readable, 'from')
        .mockImplementationOnce((buffer) => {
          const readable = originalFrom(buffer);

          process.nextTick(() =>
            readable.emit('error', new Error(CLOUDINARY_ERRORS.TEST_ERROR)),
          );
          return readable;
        });

      await expect(service.upload(file)).rejects.toThrow(
        CLOUDINARY_ERRORS.TEST_ERROR,
      );

      fromSpy.mockRestore();
    });
  });
});
