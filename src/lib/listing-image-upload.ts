const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export function isUploadFile(value: FormDataEntryValue | null): value is Blob & { name?: string; type: string; size: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Blob).arrayBuffer === "function" &&
      typeof (value as Blob).size === "number"
  );
}

export function isAllowedListingImage(file: { name?: string; type?: string }) {
  const type = (file.type || "").toLowerCase();
  if (ALLOWED_TYPES.has(type) || type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name || "");
}

export function guessImageContentType(file: { name?: string; type?: string }) {
  const type = (file.type || "").toLowerCase();
  if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
  if (ALLOWED_TYPES.has(type)) return type;
  const name = file.name || "";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  return "image/jpeg";
}

export async function prepareListingImage(file: File): Promise<File> {
  if (!isAllowedListingImage(file)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF photo.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 2000;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare that photo.");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    if (!blob) throw new Error("Could not prepare that photo.");
    const baseName = file.name.replace(/\.[^.]+$/, "") || "watch";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch (error) {
    const looksHeic = /heic|heif/i.test(`${file.type} ${file.name}`);
    if (looksHeic) {
      throw new Error("This photo format isn’t supported. Save it as JPEG or PNG and try again.");
    }
    if (file.size <= 4 * 1024 * 1024 && isAllowedListingImage(file)) return file;
    throw error instanceof Error ? error : new Error("Could not read that photo. Try a JPEG or PNG.");
  }
}
