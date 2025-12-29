export const CLOUDINARY_ERRORS = {
  CONFIG_MISSING: 'Cloudinary configuration is missing',
  BUFFER_EMPTY: 'File buffer is empty',
  UPLOAD_FAILED: 'Failed to upload file to Cloudinary',
  NO_SECURE_URL: 'No secure URL found in Cloudinary response',
  DELETE_FAILED: 'Failed to delete file from Cloudinary',
  GET_URL_FAILED: 'Failed to generate public URL from Cloudinary',
} as const;
