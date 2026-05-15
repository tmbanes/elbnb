export const ACCOMMODATION_IMAGE_BUCKET = "accommodation_image";

/** Normalize a storage path, public URL, or signed URL to `accommodations/{id}/{file}`. */
export function accommodationImageStoragePath(urlOrPath: string): string {
  if (!urlOrPath) return "";
  if (urlOrPath.startsWith("accommodations/")) return urlOrPath.split("?")[0];

  const patterns = [
    `/object/public/${ACCOMMODATION_IMAGE_BUCKET}/`,
    `/object/sign/${ACCOMMODATION_IMAGE_BUCKET}/`,
    `/${ACCOMMODATION_IMAGE_BUCKET}/`,
  ];

  for (const pattern of patterns) {
    const idx = urlOrPath.indexOf(pattern);
    if (idx !== -1) {
      return decodeURIComponent(urlOrPath.slice(idx + pattern.length).split("?")[0]);
    }
  }

  return urlOrPath.split("?")[0];
}

export function accommodationImageFileName(urlOrPath: string): string {
  const path = accommodationImageStoragePath(urlOrPath);
  return path.split("/").pop() ?? "";
}

export function isSameAccommodationImage(a: string, b: string): boolean {
  return accommodationImageStoragePath(a) === accommodationImageStoragePath(b);
}

export function isAbsoluteImageUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function isAccommodationImageStoragePath(value: string): boolean {
  return value.startsWith("accommodations/");
}
