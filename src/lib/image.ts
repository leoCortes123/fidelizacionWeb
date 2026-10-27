/**
 * Compresión de imágenes en el navegador antes de subirlas a Storage.
 * Mantiene el formato cuando ya es pequeño y convierte a JPEG cuando hay
 * que reducir el lado mayor. El límite del bucket es 2 MB.
 */
export interface PreparedImage {
  blob: Blob;
  extension: 'jpg' | 'png' | 'webp';
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function extensionFor(type: string): PreparedImage['extension'] {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export function isSupportedImage(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareImage(
  file: File,
  maxSide = 1200,
  quality = 0.85,
): Promise<PreparedImage> {
  if (!isSupportedImage(file)) {
    throw new Error('Formato no permitido. Usa JPEG, PNG o WebP.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 10 MB.');
  }

  const source = await loadBitmap(file);
  const width = 'width' in source ? source.width : 0;
  const height = 'height' in source ? source.height : 0;
  const ratio = Math.min(1, maxSide / Math.max(width || maxSide, height || maxSide));

  // Si ya es pequeña y cabe en el bucket, se sube sin recomprimir.
  if (file.size <= MAX_UPLOAD_BYTES && ratio === 1) {
    return {
      blob: file,
      extension: extensionFor(file.type),
      contentType: file.type as PreparedImage['contentType'],
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('El navegador no pudo procesar la imagen.');
  }
  context.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  if ('close' in source && typeof source.close === 'function') source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) {
    throw new Error('No pudimos comprimir la imagen. Prueba con otra.');
  }

  return { blob, extension: 'jpg', contentType: 'image/jpeg' };
}
