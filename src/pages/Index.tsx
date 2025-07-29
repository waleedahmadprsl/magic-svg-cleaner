import React, { useState, useEffect, useCallback } from 'react';
import { ProcessedImage, ProcessingStats } from '../types/image';
import { ImageProcessor } from '../services/imageProcessor';
import { downloadSVGsAsZip } from '../services/zipService';
import { ImageUpload } from '../components/ImageUpload';
import { ImageCard } from '../components/ImageCard';
import { ProcessingStats as StatsComponent } from '../components/ProcessingStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processor] = useState(() => new ImageProcessor());

  // Calculate stats
  const stats: ProcessingStats = {
    total: images.length,
    pending: images.filter(img => img.status === 'pending').length,
    processing: images.filter(img => img.status === 'processing').length,
    completed: images.filter(img => img.status === 'completed').length,
    error: images.filter(img => img.status === 'error').length,
  };

  // Load stored images on mount
  useEffect(() => {
    const loadStoredImages = async () => {
      try {
        const storedImages = await processor.loadStoredImages();
        setImages(storedImages);
      } catch (error) {
        console.error('Error loading stored images:', error);
      }
    };
    loadStoredImages();
  }, [processor]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    toast.success(`Starting processing of ${files.length} images...`);

    try {
      // Update processor callback
      processor['onProgressUpdate'] = setImages;
      
      await processor.processImages(files);
      toast.success('All images processed successfully!');
    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Error processing images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [processor]);

  const handleDownloadZip = useCallback(async () => {
    if (stats.completed === 0) {
      toast.error('No completed images to download');
      return;
    }

    try {
      await downloadSVGsAsZip(images);
      toast.success(`Downloaded ${stats.completed} SVG files as ZIP`);
    } catch (error) {
      console.error('Error downloading ZIP:', error);
      toast.error('Failed to download ZIP file');
    }
  }, [images, stats.completed]);

  const handleClearAll = useCallback(async () => {
    try {
      await processor.clearAllData();
      
      // Revoke all object URLs
      images.forEach(image => {
        if (image.originalUrl) URL.revokeObjectURL(image.originalUrl);
        if (image.cleanedImageUrl) URL.revokeObjectURL(image.cleanedImageUrl);
        if (image.svgUrl) URL.revokeObjectURL(image.svgUrl);
      });
      
      setImages([]);
      toast.success('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Failed to clear data');
    }
  }, [processor, images]);

  const canDownload = stats.completed > 0 && !isProcessing;
  const canClear = images.length > 0 && !isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI Image Processor</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Background Removal & SVG Converter
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload images in bulk, remove backgrounds automatically, and convert to scalable SVG format. 
            All processing happens in your browser for maximum privacy.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownloadZip}
            disabled={!canDownload}
            className="min-w-[200px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Download SVGs ({stats.completed})
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleClearAll}
            disabled={!canClear}
            className="min-w-[160px]"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>

        {/* Stats */}
        {images.length > 0 && (
          <StatsComponent stats={stats} />
        )}

        {/* Upload Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload 
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
            />
          </CardContent>
        </Card>

        {/* Images Grid */}
        {images.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Processing Queue ({images.length} images)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map((image) => (
                  <ImageCard key={image.id} image={image} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Powered by AI background removal and client-side processing. 
            Your images never leave your device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
