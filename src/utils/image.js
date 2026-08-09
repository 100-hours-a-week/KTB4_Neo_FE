const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

export function resolveImageUrl(imageUrl, fallbackUrl = "") {
  if (!imageUrl || imageUrl === "null") return fallbackUrl;
  if (/^(https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return `${API_BASE_URL}${imageUrl}`;
  return `${API_BASE_URL}/${imageUrl}`;
}
