import { supabase } from '../services/supabase.ts';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

export interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  quality?: number;
  resize?: {
    width?: number;
    height?: number;
  };
}

/**
 * Upload a profile picture to Supabase Storage
 */
export async function uploadProfilePicture(
  file: File,
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    quality = 80,
    resize
  } = options;

  // Validate file
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `profile-pictures/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      fileName
    };
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture. Please try again.');
  }
}

/**
 * Upload community media (images for posts) to Supabase Storage
 */
export async function uploadCommunityMedia(
  file: File,
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    quality = 80,
    resize
  } = options;

  // Validate file
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `community-media/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('community-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('community-media')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      fileName
    };
  } catch (error) {
    console.error('Error uploading community media:', error);
    throw new Error('Failed to upload media. Please try again.');
  }
}

/**
 * Upload chat media to Supabase Storage
 */
export async function uploadChatMedia(
  file: File,
  conversationId: string,
  userId: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default for chat media
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg'],
    quality = 80,
    resize
  } = options;

  // Validate file
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images, videos, and audio files are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${conversationId}/${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `chat-media/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-media')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      fileName
    };
  } catch (error) {
    console.error('Error uploading chat media:', error);
    throw new Error('Failed to upload media. Please try again.');
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file. Please try again.');
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  if (!originalUrl) return originalUrl;

  const { width, height, quality = 80, resize = 'contain' } = options;

  // Remove any existing query parameters
  const baseUrl = originalUrl.split('?')[0];

  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('resize', resize);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Compress image before upload
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png'] } = options;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  return { valid: true };
}