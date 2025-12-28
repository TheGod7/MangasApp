import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';
import type { ConfigOptions } from 'cloudinary';

import { CloudinaryProvider } from '../cloudinary.provider';
import { CLOUDINARY_ERRORS } from '../constants/cloudinary.errors';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
  },
}));

describe('CloudinaryProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createConfigServiceMock = (configValue?: ConfigOptions) =>
    ({
      get: jest.fn().mockReturnValue(configValue),
    }) as unknown as ConfigService;

  it('should throw error if cloudinary config is missing', () => {
    const configService = createConfigServiceMock(undefined);

    expect(() => CloudinaryProvider.useFactory(configService)).toThrow(
      CLOUDINARY_ERRORS.CONFIG_MISSING,
    );

    expect(v2.config).not.toHaveBeenCalled();
  });

  it('should throw error if cloudinary config is incomplete', () => {
    const configService = createConfigServiceMock({
      cloud_name: 'test_cloud',
      api_key: 'test_key',
    } as ConfigOptions);

    expect(() => CloudinaryProvider.useFactory(configService)).toThrow(
      CLOUDINARY_ERRORS.CONFIG_MISSING,
    );

    expect(v2.config).not.toHaveBeenCalled();
  });

  it('should call v2.config with correct config', () => {
    const cloudinaryConfig: ConfigOptions = {
      cloud_name: 'test_cloud',
      api_key: 'test_key',
      api_secret: 'test_secret',
    };

    const configService = createConfigServiceMock(cloudinaryConfig);

    CloudinaryProvider.useFactory(configService);

    expect(v2.config).toHaveBeenCalledTimes(1);
    expect(v2.config).toHaveBeenCalledWith(cloudinaryConfig);
  });
});
