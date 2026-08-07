import imageCompression from "browser-image-compression";

export async function compressImageIfNeeded(file: File, maxSizeMB = 1.2): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= maxSizeMB * 1024 * 1024) return file;
  try {
    return await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 2000,
      useWebWorker: true,
      fileType: file.type,
    });
  } catch {
    return file;
  }
}
