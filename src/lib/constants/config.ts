export const UPLOAD = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_IMAGE_TYPES: ["image/png", "image/jpeg", "image/webp"],
  ALLOWED_EXTENSIONS: ["png", "jpg", "jpeg", "webp"],
} as const;

export const CSV = {
  MAX_SIZE: 1 * 1024 * 1024, // 1MB
  MAX_ROWS: 5000,
} as const;
