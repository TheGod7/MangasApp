interface CloudinaryDestroyResponse {
  result: string;
}

interface CloudinaryAdminDeleteResponse {
  deleted: Record<string, string>;
  partial: boolean;
}

interface CreateUploadStreamMockOptions {
  publicId?: string;
  publicIds?: string[];

  generateUrl?: boolean;
  fixedUrl?: string;

  ErrorOnPipe?: boolean;
  ErrorOnUpload?: boolean;
}

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  [key: string]: any;
}

interface CreateDeleteResourcesMockOptions {
  customStatuses?: Record<string, string>;
  errorOnDelete?: boolean;
  defaultStatus?: 'deleted' | 'ok' | 'not_found';
}

export type {
  CloudinaryDestroyResponse,
  CloudinaryAdminDeleteResponse,
  CreateUploadStreamMockOptions,
  CreateDeleteResourcesMockOptions,
  CloudinaryResource,
};
