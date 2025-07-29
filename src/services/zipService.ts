import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ProcessedImage } from '../types/image';

export const downloadSVGsAsZip = async (images: ProcessedImage[]): Promise<void> => {
  const zip = new JSZip();
  
  // Filter only completed images with SVG data
  const completedImages = images.filter(img => 
    img.status === 'completed' && img.svgBlob
  );

  if (completedImages.length === 0) {
    throw new Error('No completed SVGs to download');
  }

  // Add each SVG to the zip
  for (let i = 0; i < completedImages.length; i++) {
    const image = completedImages[i];
    if (image.svgBlob) {
      // Use original filename with .svg extension
      const originalName = image.originalFile.name.split('.')[0];
      const filename = `${originalName}_${image.id.slice(0, 8)}.svg`;
      zip.file(filename, image.svgBlob);
    }
  }

  // Generate and download the zip
  try {
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `processed_images_${new Date().toISOString().slice(0, 10)}.zip`);
  } catch (error) {
    console.error('Error generating ZIP:', error);
    throw new Error('Failed to generate ZIP file');
  }
};