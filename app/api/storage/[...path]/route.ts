// Development-only: Proxy Convex storage requests to the backend
// This enables Next.js image optimization when running self-hosted Convex in Docker.
// The Next.js server fetches from convex-backend:3210 (Docker internal network).
//
// In production, this route is never invoked because:
// - Convex Cloud returns absolute URLs (https://xxx.convex.cloud/api/storage/...)
// - Self-hosted with a domain uses CONVEX_CLOUD_ORIGIN to return absolute public URLs
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const convexUrl =
    process.env.CONVEX_SELF_HOSTED_URL || "http://convex-backend:3210";
  const storagePath = path.join("/");

  const response = await fetch(`${convexUrl}/api/storage/${storagePath}`);

  if (!response.ok) {
    return new Response(null, { status: response.status });
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const body = await response.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
