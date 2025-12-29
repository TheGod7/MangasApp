interface CloudinaryDestroyResponse {
  result: string;
}

interface CloudinaryAdminDeleteResponse {
  deleted: Record<string, string>;
  partial: boolean;
}

interface CreateUploadStreamMockOptions {
  secureUrl?: string | null;
  Urls?: string[];

  MultipleUploads?: boolean;
  ErrorOnpipe?: boolean;
  ErrorOnUpload?: boolean;
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
};
