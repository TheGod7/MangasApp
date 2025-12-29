import { ConfigService } from '@nestjs/config';
import { CLOUDINARY } from './constants/cloudinary.constants';
import { ConfigOptions, v2 } from 'cloudinary';
import { CLOUDINARY_ERRORS } from './constants/cloudinary.errors';

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
      throw new Error(CLOUDINARY_ERRORS.CONFIG_MISSING);
    }

    v2.config(cloudinaryConfig);

    return v2;
  },
  inject: [ConfigService],
};
