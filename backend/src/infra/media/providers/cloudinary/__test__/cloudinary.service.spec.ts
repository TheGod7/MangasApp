import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';

import { CloudinaryService } from '../cloudinary.service';
import { CLOUDINARY } from '../constants/cloudinary.constants';
import { CLOUDINARY_ERRORS } from '../constants/cloudinary.errors';

import {
  CreateDeleteResourcesMock,
  CreateUploadStreamMock,
  mockCloudinary,
} from './mocks/cloudinary.mock';

import { createUnitTestFile } from '@media/__test__/mocks/test-file.helpers';
import { UploadSuccess } from '@media/types/media.interface';

import {
  DEFOULT_PUBLICID,
  JPG_EXT,
  URL_PREFIX,
} from './mocks/cloudinary.mock.constants';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
      publicId: DEFOULT_PUBLICID,
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

  /* -------------------------------------------------------------------------- */
  /*                                    upload                                  */
  /* -------------------------------------------------------------------------- */

  describe('upload', () => {
    it('should upload a file to cloudinary', async () => {
      const file = createUnitTestFile({ filename: 'test.jpg' });

      const result = await service.upload(file);

      expect(result).toEqual<UploadSuccess>({
        publicId: DEFOULT_PUBLICID,
        fileName: file.originalname,
        url: URL_PREFIX + DEFOULT_PUBLICID + JPG_EXT,
      });

      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalledTimes(1);
    });

    it('should throw UPLOAD_FAILED if cloudinary upload fails', async () => {
      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
        ErrorOnUpload: true,
      });

      const file = createUnitTestFile({ filename: 'test.jpg' });

      await expect(service.upload(file)).rejects.toThrow(
        CLOUDINARY_ERRORS.UPLOAD_FAILED,
      );
    });

    it('should throw NO_SECURE_URL if secure_url is missing', async () => {
      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
        generateUrl: false,
      });

      const file = createUnitTestFile({ filename: 'test.jpg' });

      await expect(service.upload(file)).rejects.toThrow(
        CLOUDINARY_ERRORS.NO_SECURE_URL,
      );
    });

    it('should throw BUFFER_EMPTY if file buffer is empty', async () => {
      const file = createUnitTestFile({ buffer: Buffer.from('') });

      await expect(service.upload(file)).rejects.toThrow(
        CLOUDINARY_ERRORS.BUFFER_EMPTY,
      );
    });

    it('should reject if the readable stream emits an error', async () => {
      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
        ErrorOnPipe: true,
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

  /* -------------------------------------------------------------------------- */
  /*                                 uploadMany                                 */
  /* -------------------------------------------------------------------------- */

  describe('uploadMany', () => {
    const correctFiles = [
      createUnitTestFile({ originalname: 'test1.jpg' }),
      createUnitTestFile({ originalname: 'test2.jpg' }),
      createUnitTestFile({ originalname: 'test3.jpg' }),
      createUnitTestFile({ originalname: 'test4.jpg' }),
    ];

    const incorrectFiles = [
      {
        file: createUnitTestFile({ originalname: 'test5.jpg' }),
        error: CLOUDINARY_ERRORS.UPLOAD_FAILED,
      },
      {
        file: createUnitTestFile({ originalname: 'test6.jpg' }),
        error: CLOUDINARY_ERRORS.NO_SECURE_URL,
      },
    ];

    const mixedFiles = [
      ...correctFiles,
      ...incorrectFiles.map(({ file }) => file),
    ];

    const mockSuccess = (fileName: string): Promise<UploadSuccess> =>
      Promise.resolve({
        fileName,
        url: URL_PREFIX + fileName,
        publicId: fileName,
      });

    it('should upload all correct files', async () => {
      jest
        .spyOn(service, 'upload')
        .mockImplementation(async (file) => mockSuccess(file.originalname));

      const { successes, failures } = await service.uploadMany(correctFiles);

      expect(failures).toHaveLength(0);
      expect(successes).toHaveLength(correctFiles.length);
      expect(successes.map((s) => s.fileName)).toEqual(
        correctFiles.map((f) => f.originalname),
      );
    });

    it('should correctly classify successes and failures', async () => {
      const uploadSpy = jest
        .spyOn(service, 'upload')
        .mockImplementation(async (file) => {
          const match = incorrectFiles.find(
            (f) => f.file.originalname === file.originalname,
          );
          if (match) {
            throw new Error(match.error);
          }
          return mockSuccess(file.originalname);
        });

      const { successes, failures } = await service.uploadMany(mixedFiles);

      expect(successes).toHaveLength(correctFiles.length);
      expect(failures).toHaveLength(incorrectFiles.length);
      expect(uploadSpy).toHaveBeenCalledTimes(mixedFiles.length);
    });

    it('should handle an empty array without calling upload', async () => {
      const uploadSpy = jest.spyOn(service, 'upload');

      const { successes, failures } = await service.uploadMany([]);

      expect(successes).toHaveLength(0);
      expect(failures).toHaveLength(0);
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('should call upload exactly once per file', async () => {
      const uploadSpy = jest
        .spyOn(service, 'upload')
        .mockResolvedValue(mockSuccess('x'));

      await service.uploadMany(correctFiles);

      expect(uploadSpy).toHaveBeenCalledTimes(correctFiles.length);
      correctFiles.forEach((file, index) => {
        expect(uploadSpy).toHaveBeenNthCalledWith(index + 1, file);
      });
    });

    it('should map Error and non-Error rejections correctly', async () => {
      jest
        .spyOn(service, 'upload')
        .mockRejectedValueOnce(new Error('Custom Error'))
        .mockRejectedValueOnce('String Error');

      const file1 = createUnitTestFile({ originalname: 'error1.jpg' });
      const file2 = createUnitTestFile({ originalname: 'error2.jpg' });

      const { failures } = await service.uploadMany([file1, file2]);

      expect(failures).toEqual([
        { fileName: 'error1.jpg', error: 'Custom Error' },
        {
          fileName: 'error2.jpg',
          error: CLOUDINARY_ERRORS.UPLOAD_FAILED,
        },
      ]);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                   delete                                   */
  /* -------------------------------------------------------------------------- */

  describe('delete', () => {
    const publicId = 'public_id';

    it('should throw DELETE_FAILED if publicId is empty', async () => {
      await expect(service.delete('')).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });

    it('should call cloudinary destroy and resolve on success', async () => {
      await service.delete(publicId);

      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(
        publicId,
        expect.any(Function),
      );
    });

    it('should reject if destroy callback returns error', async () => {
      mockCloudinary.uploader.destroy.mockImplementationOnce((_id, cb) =>
        cb(new Error(), null),
      );

      await expect(service.delete(publicId)).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });

    it('should reject if destroy result is not ok', async () => {
      mockCloudinary.uploader.destroy.mockImplementationOnce((_id, cb) =>
        cb(null, { result: 'not_found' }),
      );

      await expect(service.delete(publicId)).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                                 deleteMany                                 */
  /* -------------------------------------------------------------------------- */

  describe('deleteMany', () => {
    const validIds = ['id_success_1', 'id_success_2'];
    const failedIds = ['id_fail_not_found', 'id_fail_missing'];
    const mixedIds = [...validIds, ...failedIds];

    const customStatuses = {
      [validIds[0]]: 'deleted',
      [validIds[1]]: 'ok',
      [failedIds[0]]: 'not_found',
      [failedIds[1]]: '',
    };

    it('should return empty arrays when input is empty', async () => {
      const { successes, failures } = await service.deleteMany([]);

      expect(successes).toHaveLength(0);
      expect(failures).toHaveLength(0);
    });

    it('should map mixed delete results correctly', async () => {
      mockCloudinary.api.delete_resources = CreateDeleteResourcesMock({
        customStatuses,
        defaultStatus: 'ok',
      });

      const { successes, failures } = await service.deleteMany(mixedIds);

      expect(successes).toEqual(validIds.map((id) => ({ publicId: id })));
      expect(failures).toEqual(
        failedIds.map((id) => ({
          publicId: id,
          error: 'not_found',
        })),
      );
    });

    it('should throw DELETE_FAILED if api call fails', async () => {
      mockCloudinary.api.delete_resources = CreateDeleteResourcesMock({
        errorOnDelete: true,
      });

      await expect(service.deleteMany(mixedIds)).rejects.toThrow(
        CLOUDINARY_ERRORS.DELETE_FAILED,
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                               getPublicUrl                                 */
  /* -------------------------------------------------------------------------- */

  describe('getPublicUrl', () => {
    it('should return secure url when publicId is valid', async () => {
      const publicId = 'test_id';
      const secureUrl = URL_PREFIX + publicId;

      mockCloudinary.api.resource.mockReturnValueOnce(
        Promise.resolve({
          secure_url: secureUrl,
          public_id: publicId,
        }),
      );

      const result = await service.getPublicUrl(publicId);

      expect(result).toEqual({
        publicId,
        url: secureUrl,
      });

      expect(mockCloudinary.api.resource).toHaveBeenCalledWith(publicId);
    });

    it('should throw GET_URL_FAILED if publicId is empty', async () => {
      await expect(service.getPublicUrl('')).rejects.toThrow(
        CLOUDINARY_ERRORS.GET_URL_FAILED,
      );
    });

    it('should throw GET_URL_FAILED if cloudinary returns empty string', async () => {
      mockCloudinary.api.resource.mockReturnValueOnce(
        Promise.resolve({ secure_url: '', public_id: 'any_id' }),
      );

      await expect(service.getPublicUrl('any_id')).rejects.toThrow(
        CLOUDINARY_ERRORS.GET_URL_FAILED,
      );
    });

    it('should throw GET_URL_FAILED if cloudinary returns undefined', async () => {
      mockCloudinary.api.resource.mockReturnValueOnce(
        Promise.reject(new Error()),
      );

      await expect(service.getPublicUrl('any_id')).rejects.toThrow(
        CLOUDINARY_ERRORS.GET_URL_FAILED,
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                            getPublicUrlsMany                               */
  /* -------------------------------------------------------------------------- */

  describe('getPublicUrlsMany', () => {
    it('should return empty arrays if input is empty', async () => {
      const { successes, failures } = await service.getPublicUrlsMany([]);

      expect(successes).toHaveLength(0);
      expect(failures).toHaveLength(0);
    });

    it('should classify valid, empty and failing ids correctly', async () => {
      mockCloudinary.api.resource.mockImplementation((id: string) => {
        if (!id || id === 'id_undefined') {
          return Promise.reject(new Error('Resource not found'));
        }

        return Promise.resolve({
          secure_url: URL_PREFIX + id,
          public_id: id,
        });
      });

      const { successes, failures } = await service.getPublicUrlsMany([
        'id_ok_1',
        '',
        'id_undefined',
        'id_ok_2',
      ]);

      expect(successes).toEqual([
        { publicId: 'id_ok_1', url: URL_PREFIX + 'id_ok_1' },
        { publicId: 'id_ok_2', url: URL_PREFIX + 'id_ok_2' },
      ]);

      expect(failures).toEqual([
        { publicId: '', error: CLOUDINARY_ERRORS.GET_URL_FAILED },
        { publicId: 'id_undefined', error: CLOUDINARY_ERRORS.GET_URL_FAILED },
      ]);
    });

    it('should always call cloudinary.url with secure true', async () => {
      mockCloudinary.api.resource.mockReturnValue(
        Promise.resolve({
          secure_url: URL_PREFIX + 'x',
          public_id: 'x',
        }),
      );

      await service.getPublicUrlsMany(['x']);

      expect(mockCloudinary.api.resource).toHaveBeenCalledWith('x');
    });
  });
});
