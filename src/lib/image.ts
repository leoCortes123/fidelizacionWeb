import { supabase } from "./supabase";

/**
 * Procesamiento de imágenes en el navegador antes de subirlas a Storage.
 * Re-codifica SIEMPRE mediante `<canvas>` para eliminar metadatos EXIF/GPS,
 * reducir el lado mayor si excede `maxSide` y garantizar el límite de 2 MB del bucket.
 */
export interface PreparedImage {
  blob: Blob;
  extension: "jpg" | "png" | "webp";
  contentType: "image/jpeg" | "image/png" | "image/webp";
}

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const PUBLIC_BUCKET_SEGMENT = "/storage/v1/object/public/business-assets/";

export function isSupportedImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No pudimos leer la imagen."));
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  type: PreparedImage["contentType"],
  quality?: number,
): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function fillWhiteBackdrop(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
  context.save();
  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

export async function prepareImage(
  file: File,
  maxSide = 1200,
  quality = 0.85,
): Promise<PreparedImage> {
  if (!isSupportedImage(file)) {
    throw new Error("Formato no permitido. Usa JPEG, PNG o WebP.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("La imagen no puede superar 10 MB.");
  }

  const source = await loadBitmap(file);
  try {
    const width = "width" in source ? source.width : 0;
    const height = "height" in source ? source.height : 0;
    if (width <= 0 || height <= 0) {
      throw new Error("No pudimos leer la imagen.");
    }
    const ratio = Math.min(1, maxSide / Math.max(width, height));

    // Re-codificamos siempre desde `<canvas>` para eliminar metadatos EXIF/GPS
    // incluso cuando el archivo original ya es pequeño y cabe en el bucket.
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("El navegador no pudo procesar la imagen.");
    }
    context.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);

    if (file.type === "image/png") {
      const pngBlob = await encodeCanvas(canvas, "image/png");
      if (pngBlob && pngBlob.type === "image/png" && pngBlob.size <= MAX_UPLOAD_BYTES) {
        return { blob: pngBlob, extension: "png", contentType: "image/png" };
      }
      // Si el PNG excede 2 MB, rellenamos fondo blanco y convertimos a JPEG.
      fillWhiteBackdrop(canvas, context);
    } else if (file.type === "image/webp") {
      let webpBlob = await encodeCanvas(canvas, "image/webp", quality);
      if (
        webpBlob &&
        webpBlob.type === "image/webp" &&
        webpBlob.size > MAX_UPLOAD_BYTES &&
        quality > 0.7
      ) {
        webpBlob = await encodeCanvas(canvas, "image/webp", 0.7);
      }
      if (webpBlob && webpBlob.type === "image/webp" && webpBlob.size <= MAX_UPLOAD_BYTES) {
        return { blob: webpBlob, extension: "webp", contentType: "image/webp" };
      }
      fillWhiteBackdrop(canvas, context);
    }

    let blob = await encodeCanvas(canvas, "image/jpeg", quality);
    if (blob && blob.size > MAX_UPLOAD_BYTES && quality > 0.7) {
      blob = await encodeCanvas(canvas, "image/jpeg", 0.7);
    }
    if (!blob) {
      throw new Error("No pudimos comprimir la imagen. Prueba con otra.");
    }
    if (blob.size > MAX_UPLOAD_BYTES) {
      throw new Error("La imagen comprimida supera los 2 MB. Prueba con una más liviana.");
    }

    return { blob, extension: "jpg", contentType: "image/jpeg" };
  } finally {
    if ("close" in source && typeof source.close === "function") source.close();
  }
}

/**
 * Extrae la ruta interna en `business-assets` a partir de su URL pública.
 */
export function storagePathFromPublicUrl(url: string | null | undefined): string | null {
  const candidate = url?.trim();
  if (!candidate || candidate.length > 500) return null;
  if (candidate.includes("..") || /(%2e|%2f|%5c|\\|\s)/i.test(candidate)) return null;
  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    const index = parsed.pathname.indexOf(PUBLIC_BUCKET_SEGMENT);
    if (index === -1) return null;
    const path = parsed.pathname.slice(index + PUBLIC_BUCKET_SEGMENT.length);
    return path && !path.startsWith("/") ? path : null;
  } catch {
    return null;
  }
}

/**
 * Elimina un archivo obsoleto del bucket `business-assets` (best-effort).
 * Se invoca con el `previous_storage_path` devuelto por las RPC de imágenes
 * para evitar archivos huérfanos en Storage público.
 */
export async function removeBusinessAssetPath(path: string | null | undefined): Promise<void> {
  const clean = path?.trim();
  if (!clean) return;
  try {
    await supabase.storage.from("business-assets").remove([clean]);
  } catch {
    // Limpieza best-effort: no bloquea la operación principal si Storage falla.
  }
}

/**
 * Comprime y sube una imagen al bucket `business-assets` dentro de la carpeta
 * del negocio (`business/<businessId>/...`) y retorna su URL pública.
 */
export async function uploadBusinessAssetImage(options: {
  businessId: string;
  folder: string;
  file: File;
}): Promise<string> {
  const prepared = await prepareImage(options.file);
  const nonce = Math.random().toString(36).slice(2, 8);
  const path = `business/${options.businessId}/${options.folder}-${Date.now()}-${nonce}.${prepared.extension}`;
  const { error } = await supabase.storage.from("business-assets").upload(path, prepared.blob, {
    contentType: prepared.contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Comprime y sube la foto de perfil del usuario al bucket `business-assets`
 * dentro de su carpeta (`avatars/<userId>/...`) y retorna su URL pública.
 */
export async function uploadUserAvatarImage(userId: string, file: File): Promise<string> {
  const prepared = await prepareImage(file);
  const nonce = Math.random().toString(36).slice(2, 8);
  const path = `avatars/${userId}/avatar-${Date.now()}-${nonce}.${prepared.extension}`;
  const { error } = await supabase.storage.from("business-assets").upload(path, prepared.blob, {
    contentType: prepared.contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
  return data.publicUrl;
}
