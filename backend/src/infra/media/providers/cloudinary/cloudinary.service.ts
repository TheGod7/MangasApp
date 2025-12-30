/* eslint-disable @typescript-eslint/require-await */
import { Inject, Injectable } from '@nestjs/common';
import {
  DeleteManyResult,
  GetUrlsManyResult,
  GetUrlSuccess,
  MediaService,
  UploadManyResult,
  UploadSuccess,
} from '@media/types/media.interface';
import { v2, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './constants/cloudinary.constants';
import { CLOUDINARY_ERRORS } from './constants/cloudinary.errors';
import {
  CloudinaryAdminDeleteResponse,
  CloudinaryDestroyResponse,
} from './types/cloudinary.types';

@Injectable()
export class CloudinaryService implements MediaService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof v2) {}

  async upload(file: Express.Multer.File): Promise<UploadSuccess> {
    return new Promise((resolve, reject) => {
      if (!file?.buffer || file.buffer.length === 0) {
        return reject(new Error(CLOUDINARY_ERRORS.BUFFER_EMPTY));
      }

      const uploadStream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            return reject(new Error(CLOUDINARY_ERRORS.UPLOAD_FAILED));
          }

          if (!result.secure_url) {
            return reject(new Error(CLOUDINARY_ERRORS.NO_SECURE_URL));
          }

          resolve({
            fileName: file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
      const readable = Readable.from(file.buffer);

      readable.on('error', () => {
        reject(new Error(CLOUDINARY_ERRORS.UPLOAD_FAILED));
      });

      readable.pipe(uploadStream);
    });
  }

  async uploadMany(files: Express.Multer.File[]): Promise<UploadManyResult> {
    const successes: UploadManyResult['successes'] = [];
    const failures: UploadManyResult['failures'] = [];

    const uploadPromises = files.map(async (file) => {
      try {
        const success = await this.upload(file);
        successes.push(success);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : CLOUDINARY_ERRORS.UPLOAD_FAILED;
        failures.push({ fileName: file.originalname, error: errorMessage });
      }
    });

    await Promise.allSettled(uploadPromises);
    return { successes, failures };
  }

  async delete(publicId: string): Promise<void> {
    if (!publicId) throw new Error(CLOUDINARY_ERRORS.DELETE_FAILED);

    return new Promise<void>((resolve, reject) => {
      void this.cloudinary.uploader.destroy(
        publicId,
        (error: Error | undefined, result: CloudinaryDestroyResponse) => {
          if (error || result.result !== 'ok') {
            return reject(new Error(CLOUDINARY_ERRORS.DELETE_FAILED));
          }
          resolve();
        },
      );
    });
  }

  async deleteMany(publicIds: string[]): Promise<DeleteManyResult> {
    if (!publicIds.length) return { successes: [], failures: [] };

    try {
      const result = (await this.cloudinary.api.delete_resources(
        publicIds,
      )) as CloudinaryAdminDeleteResponse;

      const successes: DeleteManyResult['successes'] = [];
      const failures: DeleteManyResult['failures'] = [];

      for (const id of publicIds) {
        const status = result.deleted[id];
        if (status === 'deleted' || status === 'ok') {
          successes.push({ publicId: id });
        } else {
          failures.push({
            publicId: id,
            error: status || 'not_found',
          });
        }
      }

      return { successes, failures };
    } catch {
      throw new Error(CLOUDINARY_ERRORS.DELETE_FAILED);
    }
  }

  async getPublicUrl(publicId: string): Promise<GetUrlSuccess> {
    if (!publicId) throw new Error(CLOUDINARY_ERRORS.GET_URL_FAILED);

    const url = this.cloudinary.url(publicId, { secure: true });

    if (!url) throw new Error(CLOUDINARY_ERRORS.GET_URL_FAILED);

    return { publicId, url };
  }

  async getPublicUrlsMany(publicIds: string[]): Promise<GetUrlsManyResult> {
    const successes: { publicId: string; url: string }[] = [];
    const failures: { publicId: string; error: string }[] = [];

    publicIds.forEach((id) => {
      if (!id) {
        failures.push({
          publicId: id,
          error: CLOUDINARY_ERRORS.GET_URL_FAILED,
        });
        return;
      }

      const url = this.cloudinary.url(id, { secure: true });

      if (!url) {
        failures.push({
          publicId: id,
          error: CLOUDINARY_ERRORS.GET_URL_FAILED,
        });
      } else {
        successes.push({ publicId: id, url });
      }
    });

    return { successes, failures };
  }
}
