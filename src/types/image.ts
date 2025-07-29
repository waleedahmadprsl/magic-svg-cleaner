export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  cleanedImageBlob?: Blob;
  cleanedImageUrl?: string;
  svgBlob?: Blob;
  svgUrl?: string;
  progress: number;
}

export interface ProcessingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  error: number;
}