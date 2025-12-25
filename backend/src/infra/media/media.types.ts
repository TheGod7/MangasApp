import { Type } from '@nestjs/common';
import { MediaService } from './media.interface';

export type MediaModuleType = Type<any>;
export type MediaServiceType = Type<MediaService>;
