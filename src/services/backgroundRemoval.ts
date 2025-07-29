import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    
    // Use proper background removal model
    const remover = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    console.log('Image converted to base64');
    
    // Process the image with the background removal model
    console.log('Processing with background removal model...');
    const result = await remover(imageData);
    
    console.log('Background removal result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid background removal result');
    }
    
    // Find the mask result (RMBG models return different structure)
    let maskData: any = null;
    if (result[0].mask) {
      maskData = result[0].mask.data;
    } else if ((result[0] as any).data) {
      maskData = (result[0] as any).data;
    } else {
      throw new Error('No mask data found in result');
    }
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Apply mask to alpha channel (RMBG models provide direct alpha values)
    for (let i = 0; i < maskData.length; i++) {
      // Use mask value directly as alpha (RMBG models are trained to output foreground masks)
      const alpha = Math.round(maskData[i] * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    
    // Fallback: try with different model if first one fails
    try {
      console.log('Trying fallback background removal model...');
      const fallbackRemover = await pipeline('image-segmentation', 'Xenova/modnet-photographic-portrait-matting', {
        device: 'webgpu',
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      resizeImageIfNeeded(canvas, ctx, imageElement);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      const result = await fallbackRemover(imageData);
      
      if (result && Array.isArray(result) && result.length > 0) {
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = canvas.width;
        outputCanvas.height = canvas.height;
        const outputCtx = outputCanvas.getContext('2d');
        
        if (!outputCtx) throw new Error('Could not get output canvas context');
        
        outputCtx.drawImage(canvas, 0, 0);
        const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const data = outputImageData.data;
        
        const maskData = result[0].mask ? result[0].mask.data : (result[0] as any).data;
        for (let i = 0; i < maskData.length; i++) {
          data[i * 4 + 3] = Math.round(maskData[i] * 255);
        }
        
        outputCtx.putImageData(outputImageData, 0, 0);
        
        return new Promise((resolve, reject) => {
          outputCanvas.toBlob(
            (blob) => {
              if (blob) {
                console.log('Fallback background removal successful');
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob with fallback'));
              }
            },
            'image/png',
            1.0
          );
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }
    
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
