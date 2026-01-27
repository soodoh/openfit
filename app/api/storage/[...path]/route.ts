// Development-only: Proxy Convex storage requests to the backend
// This enables Next.js image optimization when running self-hosted Convex in Docker.
// The Next.js server fetches from convex-backend:3210 (Docker internal network).
//
// In production, this route is never invoked because:
// - Convex Cloud returns absolute URLs (https://xxx.convex.cloud/api/storage/...)
// - Self-hosted with a domain uses CONVEX_CLOUD_ORIGIN to return absolute public URLs
const CONVEX_URL =
  process.env.CONVEX_SELF_HOSTED_URL || "http://convex-backend:3210";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const storagePath = path.join("/");

  const response = await fetch(`${CONVEX_URL}/api/storage/${storagePath}`);

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const storagePath = path.join("/");
  const url = new URL(request.url);
  const queryString = url.search;

  const body = await request.arrayBuffer();
  const contentType =
    request.headers.get("content-type") || "application/octet-stream";

  const response = await fetch(
    `${CONVEX_URL}/api/storage/${storagePath}${queryString}`,
    {
      method: "POST",
      headers: {
        "Content-Type": contentType,
      },
      body,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(errorText, { status: response.status });
  }

  const responseData = await response.json();
  return Response.json(responseData);
}
