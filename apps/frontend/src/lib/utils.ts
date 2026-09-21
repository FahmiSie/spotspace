export { cn } from "cn"

export function getAssetUrl(path?: string | null): string {
  if (!path) return "/placeholder.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3000";
  return `${backendBase}${path.startsWith("/") ? "" : "/"}${path}`;
}
