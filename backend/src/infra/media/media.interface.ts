export interface IMediaService {
  upload(file: Express.Multer.File): Promise<string>;
  delete(publicId: string): Promise<void>;

  getPublicUrl(publicId: string): Promise<string>;
  getPublicUrlsMany(publicIds: string[]): Promise<string[]>;

  deleteMany(publicIds: string[]): Promise<void>;
  uploadMany(files: Express.Multer.File[]): Promise<string[]>;
}
