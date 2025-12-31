import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryModule } from '../cloudinary.module';
import { CloudinaryService } from '../cloudinary.service';
import { cloudinaryConfig } from '../cloudinary.config';
import {
  createIntegrationTestFile,
  createUnitTestFile,
} from '@media/__test__/mocks/test-file.helpers';
import { CLOUDINARY_ERRORS } from '../constants/cloudinary.errors';

describe('Cloudinary Integration', () => {
  let cloudinaryService: CloudinaryService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [cloudinaryConfig],
          envFilePath: [
            `.env.${process.env.NODE_ENV}.local`,
            `.env.${process.env.NODE_ENV}`,
            '.env.local',
            '.env',
          ],
        }),
        CloudinaryModule,
      ],
    }).compile();

    cloudinaryService = moduleRef.get<CloudinaryService>(CloudinaryService);
  });

  describe('Cloudinary Integration (Real API Calls)', () => {
    const validFiles = [
      createIntegrationTestFile('289-200x200.jpg'),
      createIntegrationTestFile('657-200x200.jpg'),
      createIntegrationTestFile('892-500x500.jpg'),
    ];

    const inValidFiles = [
      createUnitTestFile({
        originalname: 'test1.jpg',
        buffer: Buffer.from(''),
      }),
      createUnitTestFile({
        originalname: 'test2.jpg',
        buffer: Buffer.from('dshfsh'),
      }),
      createUnitTestFile({
        originalname: 'test3.jpg',
        buffer: Buffer.from(''),
      }),
    ];

    const mixFiles = [...validFiles, ...inValidFiles];

    const UploadedIds: string[] = [];

    describe('upload', () => {
      it('uploads a valid file and returns metadata', async () => {
        const result = await cloudinaryService.upload(validFiles[0]);

        expect(result).toHaveProperty('publicId');
        expect(result).toHaveProperty('fileName');
        expect(result).toHaveProperty('url');

        expect(result.publicId).toEqual(expect.any(String));
        expect(result.fileName).toEqual(validFiles[0].originalname);

        expect(() => new URL(result.url)).not.toThrow();
        expect(result.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);

        UploadedIds.push(result.publicId);
      });

      it('throws when the buffer is empty', async () => {
        const resultPromise = cloudinaryService.upload(inValidFiles[0]);

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.BUFFER_EMPTY,
        );
      });

      it('throws when the file buffer is invalid or unsupported', async () => {
        const resultPromise = cloudinaryService.upload(inValidFiles[1]);

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.UPLOAD_FAILED,
        );
      });
    });

    describe('uploadMany', () => {
      it('should upload multiple files and return a collection of success results', async () => {
        const result = await cloudinaryService.uploadMany(validFiles);

        expect(result.successes).toHaveLength(validFiles.length);
        expect(result.failures).toHaveLength(0);

        const originalNames = validFiles.map((f) => f.originalname);

        result.successes.forEach((success) => {
          expect(originalNames).toContain(success.fileName);
          expect(success.publicId).toEqual(expect.any(String));

          expect(() => new URL(success.url)).not.toThrow();
          expect(success.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);

          UploadedIds.push(success.publicId);
        });
      });

      it('should return a partial success report when handling a mix of valid and invalid files', async () => {
        const result = await cloudinaryService.uploadMany(mixFiles);

        expect(result.successes).toHaveLength(validFiles.length);
        expect(result.failures).toHaveLength(inValidFiles.length);

        const validNames = validFiles.map((f) => f.originalname);
        const invalidNames = inValidFiles.map((f) => f.originalname);

        result.successes.forEach((success) => {
          expect(validNames).toContain(success.fileName);
          expect(success.publicId).toEqual(expect.any(String));
          UploadedIds.push(success.publicId);
        });

        result.failures.forEach((failure) => {
          expect(invalidNames).toContain(failure.fileName);

          expect([
            CLOUDINARY_ERRORS.BUFFER_EMPTY,
            CLOUDINARY_ERRORS.UPLOAD_FAILED,
          ]).toContain(failure.error);
        });
      });
    });

    describe('getPublicUrl', () => {
      it('should generate a valid, reachable HTTPS URL for an existing resource', async () => {
        const result = await cloudinaryService.getPublicUrl(UploadedIds[0]);

        expect(result).toHaveProperty('publicId');
        expect(result).toHaveProperty('url');

        expect(result.publicId).toEqual(UploadedIds[0]);

        expect(result.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);
        expect(() => new URL(result.url)).not.toThrow();
      });

      it('should throw GET_URL_FAILED when the publicId is an empty string', async () => {
        const resultPromise = cloudinaryService.getPublicUrl('');

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.GET_URL_FAILED,
        );
      });

      it('should throw GET_URL_FAILED when the publicId is null or undefined', async () => {
        const resultPromise = cloudinaryService.getPublicUrl('none');

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.GET_URL_FAILED,
        );
      });
    });

    describe('getPublicUrlsMany', () => {
      it('should return a result object with valid URLs for multiple existing publicIds', async () => {
        const publicIds =
          await cloudinaryService.getPublicUrlsMany(UploadedIds);

        expect(publicIds.successes).toHaveLength(UploadedIds.length);
        expect(publicIds.failures).toHaveLength(0);

        const idFromSuccesses = publicIds.successes.map((s) => s.publicId);

        expect(new Set(idFromSuccesses)).toEqual(new Set(UploadedIds));

        publicIds.successes.forEach((success) => {
          expect(() => new URL(success.url)).not.toThrow();
          expect(success.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);
        });
      });

      it('should correctly categorize failures when some publicIds in the list are empty', async () => {
        const invalidIds = ['', 'none', 'invalid', 'xd'];
        const mixedIds = [...UploadedIds, ...invalidIds];

        const publicIds = await cloudinaryService.getPublicUrlsMany(mixedIds);

        expect(publicIds.successes).toHaveLength(UploadedIds.length);
        expect(publicIds.failures).toHaveLength(invalidIds.length);

        const idFromSuccesses = publicIds.successes.map((s) => s.publicId);
        expect(new Set(idFromSuccesses)).toEqual(new Set(UploadedIds));

        const idFromFailures = publicIds.failures.map((s) => s.publicId);
        expect(new Set(idFromFailures)).toEqual(new Set(invalidIds));

        publicIds.successes.forEach((success) => {
          expect(() => new URL(success.url)).not.toThrow();
          expect(success.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);
        });

        publicIds.failures.forEach((failure) => {
          expect(failure.error).toEqual(CLOUDINARY_ERRORS.GET_URL_FAILED);
        });
      });

      it('should handle a list containing only invalid or empty IDs', async () => {
        const invalidIds = ['', 'none', 'invalid', 'xd'];

        const publicIds = await cloudinaryService.getPublicUrlsMany(invalidIds);

        expect(publicIds.successes).toHaveLength(0);
        expect(publicIds.failures).toHaveLength(invalidIds.length);

        const idFromFailures = publicIds.failures.map((s) => s.publicId);
        expect(new Set(idFromFailures)).toEqual(new Set(invalidIds));

        publicIds.failures.forEach((failure) => {
          expect(failure.error).toEqual(CLOUDINARY_ERRORS.GET_URL_FAILED);
        });
      });

      it('should return empty successes and failures when an empty array is provided', async () => {
        const publicIds = await cloudinaryService.getPublicUrlsMany([]);

        expect(publicIds.successes).toHaveLength(0);
        expect(publicIds.failures).toHaveLength(0);
      });
    });

    describe('delete', () => {
      it('should successfully remove an existing resource from Cloudinary', async () => {
        const result = await cloudinaryService.delete(UploadedIds[0]);

        expect(result).toBeUndefined();

        const resultPromise = cloudinaryService.getPublicUrl(UploadedIds[0]);

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.GET_URL_FAILED,
        );

        UploadedIds.shift();
      });

      it('should reject deletion for an invalid publicId', async () => {
        const resultPromise = cloudinaryService.delete('none');

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.DELETE_FAILED,
        );
      });
    });

    describe('deleteMany', () => {
      it('should perform a batch deletion of multiple resources using the Admin API', async () => {
        const halfIds = UploadedIds.slice(0, UploadedIds.length / 2);
        const result = await cloudinaryService.deleteMany(halfIds);

        expect(result.successes).toHaveLength(halfIds.length);
        expect(result.failures).toHaveLength(0);

        const idFromSuccesses = result.successes.map((s) => s.publicId);
        expect(new Set(idFromSuccesses)).toEqual(new Set(halfIds));

        UploadedIds.splice(0, halfIds.length);
      });

      it('should correctly report which resources were deleted and which were not found', async () => {
        const invalidIds = ['', 'none', 'invalid', 'xd'];
        const mixedIds = [...UploadedIds, ...invalidIds];

        const result = await cloudinaryService.deleteMany(mixedIds);

        expect(result.successes).toHaveLength(UploadedIds.length);
        expect(result.failures).toHaveLength(invalidIds.length);

        const idFromSuccesses = result.successes.map((s) => s.publicId);
        expect(new Set(idFromSuccesses)).toEqual(new Set(UploadedIds));

        const idFromFailures = result.failures.map((s) => s.publicId);
        expect(new Set(idFromFailures)).toEqual(new Set(invalidIds));

        UploadedIds.splice(0, UploadedIds.length);

        result.failures.forEach((failure) => {
          expect(failure.error).toEqual(expect.any(String));
        });
      });
    });

    describe('Full Media Lifecycle (End-to-End Flow)', () => {
      it('should upload a file, verify its URL exists, and finally delete it to clean up', async () => {
        const public_id = await cloudinaryService.upload(validFiles[0]);

        expect(() => new URL(public_id.url)).not.toThrow();
        expect(public_id.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);

        const url = await cloudinaryService.getPublicUrl(public_id.publicId);

        expect(() => new URL(url.url)).not.toThrow();
        expect(url.url).toMatch(/^https:\/\/res\.cloudinary\.com\/.+/);

        expect(url.publicId).toEqual(public_id.publicId);

        const derletePromise = await cloudinaryService.delete(
          public_id.publicId,
        );

        expect(derletePromise).toBeUndefined();

        const resultPromise = cloudinaryService.getPublicUrl(
          public_id.publicId,
        );

        await expect(resultPromise).rejects.toThrow(
          CLOUDINARY_ERRORS.GET_URL_FAILED,
        );
      });
    });
  });
});
