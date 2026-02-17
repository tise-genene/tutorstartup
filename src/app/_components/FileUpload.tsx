"use client";

import { useRef } from 'react';
import { useFileUpload, UploadedFile, formatFileSize, getFileIcon } from '../../hooks/useFileUpload';

interface FileUploadProps {
  bucket: 'messages' | 'proposals' | 'avatars';
  folder?: string;
  multiple?: boolean;
  onFilesUploaded?: (files: UploadedFile[]) => void;
  existingFiles?: UploadedFile[];
  className?: string;
}

export function FileUpload({
  bucket,
  folder,
  multiple = true,
  onFilesUploaded,
  existingFiles = [],
  className = ''
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    files, 
    uploading, 
    progress, 
    errors, 
    uploadFiles, 
    removeFile,
    clearFiles 
  } = useFileUpload({ bucket, folder });

  const allFiles = [...existingFiles, ...files];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = await uploadFiles(e.target.files);
    if (uploaded.length > 0) {
      onFilesUploaded?.(uploaded);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const uploaded = await uploadFiles(e.dataTransfer.files);
    if (uploaded.length > 0) {
      onFilesUploaded?.(uploaded);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--brand)] hover:bg-[var(--brand-bg-subtle)] transition-colors"
        style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          accept={bucket === 'avatars' ? 'image/*' : undefined}
        />
        
        {uploading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)] mx-auto mb-2"></div>
            <p className="text-sm text-[var(--muted)]">Uploading...</p>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-12 w-12 text-[var(--muted)]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-2 text-sm text-[var(--muted)]">
              <span className="text-[var(--brand)] font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              {bucket === 'messages' ? 'Images, PDFs, Documents up to 10MB' :
               bucket === 'proposals' ? 'PDFs and Word documents up to 5MB' :
               'JPG, PNG, WebP up to 2MB'}
            </p>
          </>
        )}
      </div>

      {/* Error Messages */}
      {Object.entries(errors).length > 0 && (
        <div className="space-y-1">
          {Object.entries(errors).map(([fileName, error]) => (
            <div key={fileName} className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">
              {fileName}: {error}
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {allFiles.length > 0 && (
        <div className="space-y-2">
          {allFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-[var(--bg-elevated)] rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-2">
                {/* Progress bar for uploading files */}
                {progress[file.name] !== undefined && progress[file.name] < 100 && (
                  <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--brand)] transition-all duration-300"
                      style={{ width: `${progress[file.name]}%` }}
                    />
                  </div>
                )}
                
                {/* Download link */}
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--brand)] hover:underline text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </a>
                
                {/* Remove button (only for newly uploaded files) */}
                {files.some((f: UploadedFile) => f.id === file.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear all button */}
      {files.length > 0 && (
        <button
          onClick={clearFiles}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] underline"
        >
          Clear uploaded files
        </button>
      )}
    </div>
  );
}
