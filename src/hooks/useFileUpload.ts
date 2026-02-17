import { useState, useCallback } from 'react';
import { createClient } from '../lib/supabase';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

export interface UseFileUploadOptions {
  bucket: 'messages' | 'proposals' | 'avatars';
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  folder?: string;
}

export interface UseFileUploadReturn {
  files: UploadedFile[];
  uploading: boolean;
  progress: Record<string, number>;
  errors: Record<string, string>;
  uploadFiles: (files: FileList | null) => Promise<UploadedFile[]>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
}

const BUCKET_CONFIG = {
  messages: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  },
  proposals: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  avatars: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
};

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { bucket, maxFileSize, allowedTypes, folder } = options;
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = BUCKET_CONFIG[bucket];
  const effectiveMaxSize = maxFileSize || config.maxSize;
  const effectiveAllowedTypes = allowedTypes || config.allowedTypes;

  const validateFile = (file: File): string | null => {
    if (file.size > effectiveMaxSize) {
      return `File size exceeds ${(effectiveMaxSize / 1024 / 1024).toFixed(1)}MB limit`;
    }
    if (!effectiveAllowedTypes.includes(file.type)) {
      return `File type not allowed. Allowed: ${effectiveAllowedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    return null;
  };

  const uploadFiles = useCallback(async (
    fileList: FileList | null
  ): Promise<UploadedFile[]> => {
    if (!fileList || fileList.length === 0) return [];

    const supabase = createClient();
    const uploadedFiles: UploadedFile[] = [];
    const newErrors: Record<string, string> = {};
    const newProgress: Record<string, number> = {};

    setUploading(true);
    setErrors({});

    try {
      // Validate all files first
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const error = validateFile(file);
        if (error) {
          newErrors[file.name] = error;
          continue;
        }
        newProgress[file.name] = 0;
      }

      setProgress(newProgress);
      setErrors(newErrors);

      // Upload valid files
      const uploadPromises = Array.from(fileList).map(async (file) => {
        if (newErrors[file.name]) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          newErrors[file.name] = error.message;
          setErrors({ ...newErrors });
          return null;
        }

        // Get public URL (for avatars) or signed URL (for private buckets)
        let url: string;
        if (bucket === 'avatars') {
          const { data: publicUrl } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);
          url = publicUrl.publicUrl;
        } else {
          const { data: signedUrl } = await supabase.storage
            .from(bucket)
            .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days
          url = signedUrl?.signedUrl || '';
        }

        const uploadedFile: UploadedFile = {
          id: data.path,
          name: file.name,
          size: file.size,
          type: file.type,
          url,
          path: data.path
        };

        // Update progress
        newProgress[file.name] = 100;
        setProgress({ ...newProgress });

        return uploadedFile;
      });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter((f): f is UploadedFile => f !== null);
      
      setFiles(prev => [...prev, ...validResults]);
      uploadedFiles.push(...validResults);

      return uploadedFiles;
    } catch (error) {
      console.error('Upload error:', error);
      return uploadedFiles;
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, effectiveMaxSize, effectiveAllowedTypes]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setProgress({});
    setErrors({});
  }, []);

  return {
    files,
    uploading,
    progress,
    errors,
    uploadFiles,
    removeFile,
    clearFiles
  };
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('sheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
  if (type.includes('text')) return '📃';
  if (type.includes('zip') || type.includes('compressed')) return '📦';
  return '📎';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
