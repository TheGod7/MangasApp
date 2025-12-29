export interface UploadSuccess {
  fileName: string;
  url: string;
}

export interface UploadFailure {
  fileName: string;
  error: string;
}

export interface DeleteSuccess {
  publicId: string;
}

export interface DeleteFailure {
  publicId: string;
  error: string;
}

export interface GetUrlSuccess {
  publicId: string;
  url: string;
}

export interface GetUrlFailure {
  publicId: string;
  error: string;
}

export interface UploadManyResult {
  successes: UploadSuccess[];
  failures: UploadFailure[];
}

export interface DeleteManyResult {
  successes: DeleteSuccess[];
  failures: DeleteFailure[];
}

export interface GetUrlsManyResult {
  successes: GetUrlSuccess[];
  failures: GetUrlFailure[];
}

export abstract class MediaService {
  abstract upload(file: Express.Multer.File): Promise<string>;
  abstract delete(publicId: string): Promise<void>;
  abstract getPublicUrl(publicId: string): Promise<string>;

  abstract getPublicUrlsMany(publicIds: string[]): Promise<GetUrlsManyResult>;

  abstract uploadMany(files: Express.Multer.File[]): Promise<UploadManyResult>;
  abstract deleteMany(publicIds: string[]): Promise<DeleteManyResult>;
}
