import { CLOUDINARY_ERRORS } from '../../constants/cloudinary.errors';
import { UploadFailure, UploadSuccess } from '@media/types/media.interface';
import {
  CreateUploadStreamMock,
  mockCloudinary,
} from '../mocks/cloudinary.mock';

const mockFilesUpload = (
  correctFiles: Express.Multer.File[],
  incorrectFiles: { file: Express.Multer.File; error: string }[],
  HTTP_PREFIX = 'https://example.com/',
) => {
  correctFiles.forEach((file) => {
    mockCloudinary.uploader.upload_stream.mockImplementationOnce(
      CreateUploadStreamMock({ secureUrl: HTTP_PREFIX + file.originalname }),
    );
  });

  incorrectFiles.forEach(({ error }) => {
    mockCloudinary.uploader.upload_stream.mockImplementationOnce(
      error === CLOUDINARY_ERRORS.NO_SECURE_URL
        ? CreateUploadStreamMock({})
        : CreateUploadStreamMock({ ErrorOnUpload: true }),
    );
  });
};

const expectUploadSuccesses = (
  actual: UploadSuccess[],
  expectedFiles: Express.Multer.File[],
  HTTP_PREFIX = 'https://example.com/',
) => {
  actual.forEach((obj, i) => {
    expect(obj).toMatchObject({
      fileName: expectedFiles[i].originalname,
      url: HTTP_PREFIX + expectedFiles[i].originalname,
    });
  });
};

const expectUploadFailures = (
  actual: UploadFailure[],
  expectedErrors: { file: Express.Multer.File; error: string }[],
) => {
  actual.forEach((obj, i) => {
    expect(obj).toMatchObject({
      fileName: expectedErrors[i].file.originalname,
      error: expectedErrors[i].error,
    });
  });
};

const expectDeleteSuccesses = (
  actual: { publicId: string }[],
  expectedIds: string[],
) => {
  actual.forEach((obj, i) => {
    expect(obj).toMatchObject({
      publicId: expectedIds[i],
    });
  });
};

const expectDeleteFailures = (
  actual: { publicId: string; error: string }[],
  expectedErrors: { id: string; error: string }[],
) => {
  actual.forEach((obj, i) => {
    expect(obj).toMatchObject({
      publicId: expectedErrors[i].id,
      error: expectedErrors[i].error,
    });
  });
};

export {
  mockFilesUpload,
  expectUploadSuccesses,
  expectUploadFailures,
  expectDeleteSuccesses,
  expectDeleteFailures,
};
