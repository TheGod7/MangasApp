import { DynamicModule, Module } from '@nestjs/common';
import { MEDIA_SERVICE, MEDIA_PROVIDER_DEFAULT } from './media.constants';
import { MediaModuleType, MediaServiceType } from './types/media.types';

@Module({
  imports: [],
})
export class MediaModule {
  static async forRootAsync(): Promise<DynamicModule> {
    const name = process.env.MEDIA_PROVIDER || MEDIA_PROVIDER_DEFAULT;

    const moduleImport = (await import(
      `./providers/${name}/${name}.module.js`
    )) as Record<string, MediaModuleType>;

    const serviceImport = (await import(
      `./providers/${name}/${name}.service.js`
    )) as Record<string, MediaServiceType>;

    const moduleClass = Object.values(moduleImport)[0];
    const serviceClass = Object.values(serviceImport)[0];

    if (!moduleClass || !serviceClass) {
      throw new Error(`Invalid media provider "${name}"`);
    }

    return {
      module: MediaModule,
      imports: [moduleClass],
      providers: [
        {
          provide: MEDIA_SERVICE,
          useExisting: serviceClass,
        },
      ],
      exports: [MEDIA_SERVICE],
    };
  }
}
