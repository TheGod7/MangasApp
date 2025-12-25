import { Module } from '@nestjs/common';
import { CloudinaryModule } from './providers/cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { mediaConfig } from './media.config';

@Module({
  imports: [
    CloudinaryModule,
    MulterModule.registerAsync(mediaConfig.asProvider()),
  ],
})
export class MediaModule {}
