export abstract class MediaService {
  abstract upload(file: Express.Multer.File): Promise<string>;
  abstract delete(publicId: string): Promise<void>;

  abstract getPublicUrl(publicId: string): Promise<string>;
  abstract getPublicUrlsMany(publicIds: string[]): Promise<string[]>;

  abstract deleteMany(publicIds: string[]): Promise<void>;
  abstract uploadMany(files: Express.Multer.File[]): Promise<string[]>;
}
