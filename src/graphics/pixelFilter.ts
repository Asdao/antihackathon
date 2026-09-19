/** A real raster filter: downsample, quantize, then enlarge without smoothing. */
export function createPixelFilter(width = 320, height = 180) {
  let buffer: HTMLCanvasElement | null = null;
  let bufferContext: CanvasRenderingContext2D | null = null;
  const dither = [-2.5, 1.5, 2.5, -1.5];

  return (context: CanvasRenderingContext2D) => {
    if (!buffer) {
      buffer = document.createElement('canvas');
      buffer.width = width;
      buffer.height = height;
      bufferContext = buffer.getContext('2d', { willReadFrequently: true });
    }
    if (!bufferContext) return;
    bufferContext.clearRect(0, 0, width, height);
    bufferContext.imageSmoothingEnabled = true;
    bufferContext.drawImage(context.canvas, 0, 0, width, height);
    const frame = bufferContext.getImageData(0, 0, width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const offset = dither[(y % 2) * 2 + x % 2]!;
        for (let channel = 0; channel < 3; channel++) {
          frame.data[index + channel] = Math.round((frame.data[index + channel]! + offset) / 8) * 8;
        }
      }
    }
    bufferContext.putImageData(frame, 0, 0);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'copy';
    context.imageSmoothingEnabled = false;
    context.drawImage(buffer, 0, 0, context.canvas.width, context.canvas.height);
    context.restore();
  };
}
