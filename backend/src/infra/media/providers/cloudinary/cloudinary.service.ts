/* eslint-disable @typescript-eslint/require-await */

import { Inject, Injectable } from '@nestjs/common';
import { MediaService } from '../../types/media.interface';
import { v2 } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './constants/cloudinary.constants';
import { CLOUDINARY_ERRORS } from './constants/cloudinary.errors';

@Injectable()
export class CloudinaryService implements MediaService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof v2) {}

  async upload(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file?.buffer || file.buffer.length === 0) {
        return reject(new Error(CLOUDINARY_ERRORS.BUFFER_EMPTY));
      }

      const uploadStream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            return reject(
              new Error(
                error instanceof Error
                  ? error.message
                  : CLOUDINARY_ERRORS.UPLOAD_FAILED,
              ),
            );
          }

          if (!result?.secure_url) {
            return reject(new Error(CLOUDINARY_ERRORS.NO_SECURE_URL));
          }

          resolve(result.secure_url);
        },
      );

      Readable.from(file.buffer)
        .pipe(uploadStream)
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  async uploadMany(files: Express.Multer.File[]): Promise<string[]> {
    return Promise.all(files.map((file) => this.upload(file)));
  }

  async delete(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId);
  }

  async deleteMany(publicIds: string[]): Promise<void> {
    await Promise.all(publicIds.map((id) => this.delete(id)));
  }

  async getPublicUrl(publicId: string): Promise<string> {
    return this.cloudinary.url(publicId, { secure: true });
  }

  async getPublicUrlsMany(publicIds: string[]): Promise<string[]> {
    return publicIds.map((id) => this.cloudinary.url(id, { secure: true }));
  }
}
