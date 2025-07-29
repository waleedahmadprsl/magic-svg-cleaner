// Simple SVG conversion using canvas and path tracing
export const convertToSVG = async (imageBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple edge detection and path creation
        const paths: string[] = [];
        const processedPixels = new Set<string>();

        // Trace edges and create paths
        for (let y = 0; y < canvas.height; y += 4) {
          for (let x = 0; x < canvas.width; x += 4) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];
            
            if (alpha > 128 && !processedPixels.has(`${x},${y}`)) {
              // Find connected region
              const region = floodFill(data, canvas.width, canvas.height, x, y, processedPixels);
              if (region.length > 10) {
                const path = createPathFromRegion(region);
                paths.push(path);
              }
            }
          }
        }

        // Create SVG
        const svgContent = `
          <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
            <g fill="black" stroke="none">
              ${paths.map(path => `<path d="${path}"/>`).join('\n')}
            </g>
          </svg>
        `.trim();

        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
        resolve(svgBlob);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image for SVG conversion'));
    img.src = URL.createObjectURL(imageBlob);
  });
};

function floodFill(
  data: Uint8ClampedArray, 
  width: number, 
  height: number, 
  startX: number, 
  startY: number, 
  processedPixels: Set<string>
): Array<{x: number, y: number}> {
  const region: Array<{x: number, y: number}> = [];
  const stack: Array<{x: number, y: number}> = [{x: startX, y: startY}];
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    const key = `${x},${y}`;
    
    if (processedPixels.has(key) || x < 0 || x >= width || y < 0 || y >= height) {
      continue;
    }
    
    const index = (y * width + x) * 4;
    const alpha = data[index + 3];
    
    if (alpha <= 128) continue;
    
    processedPixels.add(key);
    region.push({x, y});
    
    if (region.length > 100) break; // Limit region size
    
    // Add neighbors
    stack.push({x: x + 1, y});
    stack.push({x: x - 1, y});
    stack.push({x, y: y + 1});
    stack.push({x, y: y - 1});
  }
  
  return region;
}

function createPathFromRegion(region: Array<{x: number, y: number}>): string {
  if (region.length === 0) return '';
  
  // Sort points to create a more coherent path
  region.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
  
  let path = `M ${region[0].x} ${region[0].y}`;
  
  for (let i = 1; i < region.length; i++) {
    path += ` L ${region[i].x} ${region[i].y}`;
  }
  
  path += ' Z';
  return path;
}