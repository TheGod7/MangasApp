import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from '../cloudinary.service';
import { CLOUDINARY } from '../constants/cloudinary.constants';
import { Readable } from 'stream';

import { CLOUDINARY_ERRORS } from '../constants/cloudinary.errors';

import {
  CreateUploadStreamMock,
  mockCloudinary,
} from './mocks/cloudinary.mock';
import { createUnitTestFile } from '@media/__test__/mocks/test-file.helpers';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

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

      await expect(uploadPromise).rejects.toThrow(CLOUDINARY_ERRORS.TEST_ERROR);
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
        process.nextTick(() =>
          readable.emit('error', new Error(CLOUDINARY_ERRORS.TEST_ERROR)),
        );
        return readable;
      });

      await expect(service.upload(file)).rejects.toThrow(
        CLOUDINARY_ERRORS.TEST_ERROR,
      );
    });
  });

  describe('uploadMany', () => {
    it('should upload multiple files successfully', async () => {
      const files = [
        createUnitTestFile({ filename: 'test1.jpg', buffer: Buffer.from('a') }),
        createUnitTestFile({ filename: 'test2.jpg', buffer: Buffer.from('b') }),
      ];

      const urls = [
        'https://example.com/test1.jpg',
        'https://example.com/test2.jpg',
      ];

      mockCloudinary.uploader.upload_stream = CreateUploadStreamMock({
        Urls: urls,
        MultipleUploads: true,
      });

      const result = await service.uploadMany(files);

      expect(result).toEqual(urls);
      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should throw if one of the uploads fail', async () => {
      const files = [
        createUnitTestFile({ filename: 'test1.jpg', buffer: Buffer.from('a') }),
        createUnitTestFile({ filename: 'test2.jpg', buffer: Buffer.from('b') }),
      ];

      mockCloudinary.uploader.upload_stream.mockImplementationOnce(
        CreateUploadStreamMock({
          secureUrl: 'https://example.com/test1.jpg',
        }),
      );

      mockCloudinary.uploader.upload_stream.mockImplementationOnce(
        CreateUploadStreamMock({
          ErrorOnUpload: true,
        }),
      );

      const uploadPromise = service.uploadMany(files);

      await expect(uploadPromise).rejects.toThrow(CLOUDINARY_ERRORS.TEST_ERROR);
    });

    it('should return empty array when no files are provided', async () => {
      const result = await service.uploadMany([]);
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    const publicIds = 'public_id';

    it("Shoould call cloudinary's destroy method", async () => {
      const publicId = publicIds;
      await service.delete(publicId);

      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledTimes(1);
    });

    it('Should throw if cloudinary destroy fails', async () => {
      mockCloudinary.uploader.destroy.mockRejectedValueOnce(
        new Error(CLOUDINARY_ERRORS.TEST_ERROR),
      );

      const deletePromise = service.delete(publicIds);

      await expect(deletePromise).rejects.toThrow(CLOUDINARY_ERRORS.TEST_ERROR);
    });
  });

  describe('deleteMany', () => {
    const publicIds = ['public_id1', 'public_id2', 'public_id3'];

    it("Should call cloudinary's destroy method for each publicId", async () => {
      await service.deleteMany(publicIds);

      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledTimes(
        publicIds.length,
      );

      for (const id of publicIds) {
        expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(id);
      }
    });

    it('Should throw if one of the cloudinary destroy calls fails', async () => {
      mockCloudinary.uploader.destroy.mockRejectedValueOnce(
        new Error(CLOUDINARY_ERRORS.TEST_ERROR),
      );

      const deletePromise = service.deleteMany(publicIds);

      await expect(deletePromise).rejects.toThrow(CLOUDINARY_ERRORS.TEST_ERROR);
    });

    it('should return immediately if publicIds is empty', async () => {
      const result = await service.deleteMany([]);

      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled();

      expect(result).toBeUndefined();
    });
  });
});
