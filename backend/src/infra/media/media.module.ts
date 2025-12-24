import { Module } from '@nestjs/common';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { mediaConfig } from './media.config';

@Module({
  imports: [
    CloudinaryModule,
    MulterModule.registerAsync(mediaConfig.asProvider()),
  ],
})
export class MediaModule {}
