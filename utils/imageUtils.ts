// utils/imageUtils.ts
export function getProfilePhotoUrl(photoPath?: string): string | undefined {
  if (!photoPath) return undefined;

  // If already an absolute URL, return as is
  if (photoPath.startsWith("http")) return photoPath;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  // Ensure correct concatenation
  return photoPath.startsWith("/")
    ? `${backendUrl}${photoPath}`
    : `${backendUrl}/${photoPath}`;
}
