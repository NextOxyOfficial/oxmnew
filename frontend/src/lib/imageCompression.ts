/**
 * Client-side image compression shared by the product add and edit screens.
 *
 * Extracted from the add page so both flows shrink uploads identically —
 * previously only "add" compressed, so editing a product could push full-size
 * originals to the server.
 */

export interface CompressOptions {
  /** Longest edge, in pixels. */
  maxWidth?: number;
  /** JPEG/WebP quality, 0–1. */
  quality?: number;
}

/**
 * Downscale an image to fit `maxWidth` on its longest edge and re-encode it.
 * Resolves with the original file if the browser cannot produce a blob, so a
 * failure here never blocks an upload.
 */
export function compressImage(
  file: File,
  { maxWidth = 800, quality = 0.8 }: CompressOptions = {}
): Promise<File> {
  return new Promise((resolve) => {
    // Non-images (or SVG, which canvas would rasterise badly) pass through.
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else if (height > maxWidth) {
        width = (width * maxWidth) / height;
        height = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve(
              new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
            );
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/** Compress a list of files, keeping order. */
export async function compressImages(
  files: File[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
