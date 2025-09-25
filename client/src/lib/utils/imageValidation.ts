export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface ImageValidationOptions {
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedTypes?: string[];
  minSizeBytes?: number;
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  maxWidth: 4000,
  maxHeight: 4000,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  minSizeBytes: 1024, // 1KB
};

export function validateImage(
  file: File, 
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve) => {
    // Check file type
    if (!opts.allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: `File type not supported. Please use: ${opts.allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
      });
      return;
    }

    // Check file size
    if (file.size > opts.maxSizeBytes) {
      const maxSizeMB = (opts.maxSizeBytes / (1024 * 1024)).toFixed(1);
      const currentSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      resolve({
        isValid: false,
        error: `Image is too large. Maximum size is ${maxSizeMB}MB, but your image is ${currentSizeMB}MB. Please compress or resize your image.`
      });
      return;
    }

    if (file.size < opts.minSizeBytes) {
      resolve({
        isValid: false,
        error: 'Image is too small. Please select a larger image.'
      });
      return;
    }

    // Check image dimensions
    const img = new Image();
    img.onload = () => {
      if (img.width > opts.maxWidth || img.height > opts.maxHeight) {
        resolve({
          isValid: false,
          error: `Image dimensions are too large. Maximum size is ${opts.maxWidth}x${opts.maxHeight}px, but your image is ${img.width}x${img.height}px. Please resize your image.`
        });
        return;
      }

      // Check for very small images
      if (img.width < 100 || img.height < 100) {
        resolve({
          isValid: true,
          warning: 'Image is quite small. For best results, use images at least 200x200px.'
        });
        return;
      }

      resolve({ isValid: true });
    };

    img.onerror = () => {
      resolve({
        isValid: false,
        error: 'Invalid image file. Please select a valid image.'
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

