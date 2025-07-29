import { ProcessedImage } from '../types/image';
import { removeBackground, loadImage } from './backgroundRemoval';
import { convertToSVG } from './svgConverter';
import { storageService } from './storage';

export class ImageProcessor {
  private onProgressUpdate?: (images: ProcessedImage[]) => void;

  constructor(onProgressUpdate?: (images: ProcessedImage[]) => void) {
    this.onProgressUpdate = onProgressUpdate;
  }

  async processImages(files: File[]): Promise<ProcessedImage[]> {
    // Initialize storage
    await storageService.init();

    // Create initial image objects
    const images: ProcessedImage[] = files.map(file => ({
      id: crypto.randomUUID(),
      originalFile: file,
      originalUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }));

    // Save initial state
    for (const image of images) {
      await storageService.saveImage(image);
    }

    // Notify of initial state
    this.onProgressUpdate?.(images);

    // Process images one by one to avoid overwhelming the browser
    for (let i = 0; i < images.length; i++) {
      await this.processImage(images[i]);
      this.onProgressUpdate?.(images);
    }

    return images;
  }

  private async processImage(image: ProcessedImage): Promise<void> {
    try {
      // Update status to processing
      image.status = 'processing';
      image.progress = 10;
      await storageService.saveImage(image);

      // Step 1: Remove background
      console.log(`Processing image ${image.id}: Loading image...`);
      const imageElement = await loadImage(image.originalFile);
      image.progress = 30;
      await storageService.saveImage(image);

      console.log(`Processing image ${image.id}: Removing background...`);
      const cleanedImageBlob = await removeBackground(imageElement);
      image.cleanedImageBlob = cleanedImageBlob;
      image.cleanedImageUrl = URL.createObjectURL(cleanedImageBlob);
      image.progress = 70;
      await storageService.saveImage(image);

      // Step 2: Convert to SVG
      console.log(`Processing image ${image.id}: Converting to SVG...`);
      const svgBlob = await convertToSVG(cleanedImageBlob);
      image.svgBlob = svgBlob;
      image.svgUrl = URL.createObjectURL(svgBlob);
      image.progress = 100;
      image.status = 'completed';
      await storageService.saveImage(image);

      console.log(`Successfully processed image ${image.id}`);
    } catch (error) {
      console.error(`Error processing image ${image.id}:`, error);
      image.status = 'error';
      image.error = error instanceof Error ? error.message : 'Unknown error';
      image.progress = 0;
      await storageService.saveImage(image);
    }
  }

  async clearAllData(): Promise<void> {
    await storageService.clearAll();
  }

  async loadStoredImages(): Promise<ProcessedImage[]> {
    await storageService.init();
    return storageService.getAllImages();
  }
}