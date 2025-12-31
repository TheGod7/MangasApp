import { registerAs } from '@nestjs/config';
import { ConfigOptions } from 'cloudinary';

export const cloudinaryConfig = registerAs(
  'cloudinary',
  (): ConfigOptions => ({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  }),
);
