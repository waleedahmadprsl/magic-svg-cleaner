import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="w-full">
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload Images</h3>
            <p className="text-muted-foreground">
              Drag and drop your images here, or click to select files
            </p>
            <p className="text-sm text-muted-foreground">
              Supports: JPG, PNG, GIF, WebP
            </p>
          </div>

          <Button
            variant="outline"
            className="relative"
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};