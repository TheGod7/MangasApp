import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary.service';
import { CLOUDINARY } from '../constants/cloudinary.constants';
import { Readable } from 'stream';

import { CLOUDINARY_ERRORS } from '../constants/cloudinary.errors';

import {
  CreateDeleteResourcesMock,
  CreateUploadStreamMock,
  mockCloudinary,
} from './mocks/cloudinary.mock';
import { createUnitTestFile } from '@media/__test__/mocks/test-file.helpers';

import {
  expectUploadFailures,
  expectUploadSuccesses,
  mockFilesUpload,
} from './helpers/clodinary.helper';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
      secureUrl: 'https://example.com/image.jpg',
    });

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('upload', () => {
    it('Should upload a file to cloudinary', async () => {
      const file = createUnitTestFile({ filename: 'test.jpg' });
      const url = await service.upload(file);

      expect(url).toBe('https://example.com/image.jpg');
      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should throw if cloudinary upload fails', async () => {
      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
        ErrorOnUpload: true,
      });

      const file = createUnitTestFile({ filename: 'test.jpg' });

      const uploadPromise = service.upload(file);

      await expect(uploadPromise).rejects.toThrow(
        CLOUDINARY_ERRORS.UPLOAD_FAILED,
      );
    });

    it('should throw if no secure_url is returned', async () => {
      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({});

      const file = createUnitTestFile({ filename: 'test.jpg' });
      const uploadPromise = service.upload(file);

      await expect(uploadPromise).rejects.toThrow(
        CLOUDINARY_ERRORS.NO_SECURE_URL,
      );
    });

    it('should throw if file buffer is empty', async () => {
      const file = createUnitTestFile({ buffer: Buffer.from('') });

      const uploadPromise = service.upload(file);

      await expect(uploadPromise).rejects.toThrow(
        CLOUDINARY_ERRORS.BUFFER_EMPTY,
      );
    });

    it('should reject if the readable stream emits an error (pipe error)', async () => {
      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
        ErrorOnpipe: true,
      });

      const file = createUnitTestFile({ buffer: Buffer.from('test') });

      jest.spyOn(Readable, 'from').mockImplementationOnce((buffer) => {
        const readable = Readable.from(buffer);
        process.nextTick(() => readable.emit('error', new Error()));
        return readable;
      });

      await expect(service.upload(file)).rejects.toThrow(
        CLOUDINARY_ERRORS.UPLOAD_FAILED,
      );
    });
  });

  describe('uploadMany', () => {
    const CorrectFiles = [
      createUnitTestFile({ originalname: 'test1.jpg' }),
      createUnitTestFile({ originalname: 'test2.jpg' }),
      createUnitTestFile({ originalname: 'test3.jpg' }),
      createUnitTestFile({ originalname: 'test4.jpg' }),
    ];

    const IncorrectFiles = [
      {
        file: createUnitTestFile({ originalname: 'test5.jpg' }),
        error: CLOUDINARY_ERRORS.UPLOAD_FAILED,
      },
      {
        file: createUnitTestFile({ originalname: 'test6.jpg' }),
        error: CLOUDINARY_ERRORS.NO_SECURE_URL,
      },
    ];

    const MixedFiles = [
      ...CorrectFiles,
      ...IncorrectFiles.map(({ file }) => file),
    ];

    test('should upload all correct files', async () => {
      const uploadSpy = jest.spyOn(service, 'upload');
      mockFilesUpload(CorrectFiles, []);

      const { successes, failures } = await service.uploadMany(CorrectFiles);

      expect(failures).toHaveLength(0);
      expect(successes).toHaveLength(CorrectFiles.length);
      expect(uploadSpy).toHaveBeenCalledTimes(CorrectFiles.length);

      expectUploadSuccesses(successes, CorrectFiles);
    });

    test('should correctly classify files into successes and failures', async () => {
      const uploadSpy = jest.spyOn(service, 'upload');
      mockFilesUpload(CorrectFiles, IncorrectFiles);

      const { successes, failures } = await service.uploadMany(MixedFiles);

      expect(successes).toHaveLength(CorrectFiles.length);
      expect(failures).toHaveLength(IncorrectFiles.length);
      expect(uploadSpy).toHaveBeenCalledTimes(MixedFiles.length);

      expectUploadSuccesses(successes, CorrectFiles);
      expectUploadFailures(failures, IncorrectFiles);
    });

    test('should handle an empty array of files without throwing errors', async () => {
      const { successes, failures } = await service.uploadMany([]);

      expect(successes).toHaveLength(0);
      expect(failures).toHaveLength(0);
      expect(mockCloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    test('should call upload exactly once per file', async () => {
      const uploadSpy = jest
        .spyOn(service, 'upload')
        .mockResolvedValue('https://url.com');
      await service.uploadMany(CorrectFiles);

      expect(uploadSpy).toHaveBeenCalledTimes(CorrectFiles.length);
      CorrectFiles.forEach((file, index) => {
        expect(uploadSpy).toHaveBeenNthCalledWith(index + 1, file);
      });
    });

    it('should cover the catch block and error mapping in uploadMany', async () => {
      const file1 = createUnitTestFile({ originalname: 'error1.jpg' });
      jest
        .spyOn(service, 'upload')
        .mockRejectedValueOnce(new Error('Custom Error'));

      const file2 = createUnitTestFile({ originalname: 'error2.jpg' });
      jest.spyOn(service, 'upload').mockRejectedValueOnce('String Error');

      const { failures } = await service.uploadMany([file1, file2]);

      expect(failures[0].error).toBe('Custom Error');
      expect(failures[1].error).toBe(CLOUDINARY_ERRORS.UPLOAD_FAILED);
    });
  });

  describe('delete', () => {
    const publicId = 'public_id';

    it('should throw an error if no publicId is provided', async () => {
      const deletePromise = service.delete('');

      await expect(deletePromise).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });

    it('should call cloudinary destroy with the correct ID and resolve on success', async () => {
      await service.delete(publicId);

      expect(mockCloudinary.uploader.destroy.mock.calls[0][0]).toBe(publicId);
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
    });

    it('should reject with DELETE_FAILED if cloudinary destroy fails', async () => {
      mockCloudinary.uploader.destroy.mockImplementationOnce(
        (id: string, callback: (err: any, res: any) => void) => {
          callback(new Error('Cloudinary Error'), null);
        },
      );

      const deletePromise = service.delete(publicId);

      await expect(deletePromise).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
    });

    it('should reject with DELETE_FAILED if result.result is not "ok"', async () => {
      mockCloudinary.uploader.destroy.mockImplementationOnce(
        (id: string, callback: (err: any, res: any) => void) => {
          callback(null, { result: 'not_found' });
        },
      );

      const deletePromise = service.delete(publicId);

      await expect(deletePromise).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });
  });

  describe('deleteMany', () => {
    const VALID_IDS = ['id_success_1', 'id_success_2'];
    const FAILED_IDS = ['id_fail_not_found', 'id_fail_missing'];
    const MIXED_IDS = [...VALID_IDS, ...FAILED_IDS];

    const CUSTOM_STATUSES_MOCK = {
      [VALID_IDS[0]]: 'deleted',
      [VALID_IDS[1]]: 'ok',
      [FAILED_IDS[0]]: 'not_found',
      [FAILED_IDS[1]]: '',
    };

    it('should return empty successes and failures if publicIds array is empty', async () => {
      const { successes, failures } = await service.deleteMany([]);

      expect(successes).toHaveLength(0);
      expect(failures).toHaveLength(0);
      expect(mockCloudinary.api.delete_resources).not.toHaveBeenCalled();
    });

    it('should correctly map a mixed response of successes and failures', async () => {
      mockCloudinary.api.delete_resources = CreateDeleteResourcesMock({
        customStatuses: CUSTOM_STATUSES_MOCK,
        defaultStatus: 'ok',
      });

      const { successes, failures } = await service.deleteMany(MIXED_IDS);

      expect(successes).toHaveLength(VALID_IDS.length);
      expect(failures).toHaveLength(FAILED_IDS.length);

      expect(successes).toEqual([
        { publicId: VALID_IDS[0] },
        { publicId: VALID_IDS[1] },
      ]);
      expect(failures).toEqual([
        { publicId: FAILED_IDS[0], error: 'not_found' },
        { publicId: FAILED_IDS[1], error: 'not_found' },
      ]);
    });

    it('should throw DELETE_FAILED if the cloudinary api call fails', async () => {
      mockCloudinary.api.delete_resources = CreateDeleteResourcesMock({
        errorOnDelete: true,
      });

      const deleteManyPromise = service.deleteMany(MIXED_IDS);

      await expect(deleteManyPromise).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });
  });

  describe('getPublicUrl', () => {
    it('should return a secure URL for a given publicId', async () => {
      const publicId = 'test_id';
      const expectedUrl =
        'https://res.cloudinary.com/demo/image/upload/test_id';

      mockCloudinary.url.mockReturnValue(expectedUrl);

      const result = await service.getPublicUrl(publicId);

      expect(result).toBe(expectedUrl);
      expect(mockCloudinary.url).toHaveBeenCalledWith(publicId, {
        secure: true,
      });
    });

    it('should throw GET_URL_FAILED if publicId is not provided', async () => {
      await expect(service.getPublicUrl('')).rejects.toThrow(
        CLOUDINARY_ERRORS.GET_URL_FAILED,
      );
    });

    it('should throw GET_URL_FAILED if cloudinary returns an empty string', async () => {
      mockCloudinary.url.mockReturnValue('');

      await expect(service.getPublicUrl('any_id')).rejects.toThrow(
        CLOUDINARY_ERRORS.GET_URL_FAILED,
      );
    });
  });

  describe('getPublicUrlsMany', () => {
    const VALID_IDS = ['id_1', 'id_2'];
    const INVALID_IDS = ['', 'id_error'];

    const ALL_IDS = [...VALID_IDS, ...INVALID_IDS];

    it('should return empty successes and failures when input array is empty', async () => {
      const { successes, failures } = await service.getPublicUrlsMany([]);

      expect(successes).toHaveLength(0);
      expect(failures).toHaveLength(0);
      expect(mockCloudinary.url).not.toHaveBeenCalled();
    });

    it('should correctly classify secure URLs and generation failures', async () => {
      const HTTP_PREFIX = 'https://res.cloudinary.com/secure/';

      mockCloudinary.url.mockImplementation((id: string) => {
        if (id === 'id_error' || !id) return '';

        return `${HTTP_PREFIX}${id}`;
      });

      const { successes, failures } = await service.getPublicUrlsMany(ALL_IDS);

      expect(successes).toEqual([
        { publicId: VALID_IDS[0], url: `${HTTP_PREFIX}${VALID_IDS[0]}` },
        { publicId: VALID_IDS[1], url: `${HTTP_PREFIX}${VALID_IDS[1]}` },
      ]);

      expect(failures).toHaveLength(INVALID_IDS.length);
      expect(failures).toEqual([
        { publicId: INVALID_IDS[0], error: CLOUDINARY_ERRORS.GET_URL_FAILED },
        { publicId: INVALID_IDS[1], error: CLOUDINARY_ERRORS.GET_URL_FAILED },
      ]);

      expect(mockCloudinary.url).toHaveBeenCalledWith(VALID_IDS[0], {
        secure: true,
      });
    });

    it('should maintain strict security by passing secure: true to all calls', async () => {
      mockCloudinary.url.mockReturnValue('https://any-url.com');

      await service.getPublicUrlsMany(['id_test']);

      expect(mockCloudinary.url).toHaveBeenCalledWith('id_test', {
        secure: true,
      });
    });
  });
});
