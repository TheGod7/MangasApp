import { ConfigService } from '@nestjs/config';
import { CLOUDINARY } from './constants/cloudinary.constants';
import { ConfigOptions, v2 } from 'cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: (config: ConfigService) => {
    const cloudinaryConfig = config.get<ConfigOptions>('cloudinary');

    if (
      !cloudinaryConfig ||
      !cloudinaryConfig.cloud_name ||
      !cloudinaryConfig.api_key ||
      !cloudinaryConfig.api_secret
    ) {
      throw new Error('Cloudinary configuration is missing');
    }

    return v2.config(cloudinaryConfig);
  },
  inject: [ConfigService],
};
