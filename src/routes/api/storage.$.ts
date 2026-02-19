import { createFileRoute } from "@tanstack/react-router";
// Development-only: Proxy Convex storage requests to the backend
const CONVEX_URL = process.env.CONVEX_SELF_HOSTED_URL || "http://convex-backend:3210";
const isDevelopment = process.env.NODE_ENV === "development";
export const Route = createFileRoute("/api/storage/$")({
    server: {
        handlers: {
            GET: async ({ params }) => {
                if (!isDevelopment) {
                    return new Response("Not found", { status: 404 });
                }
                const storagePath = params._splat;
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
            },
            POST: async ({ request, params }) => {
                if (!isDevelopment) {
                    return new Response("Not found", { status: 404 });
                }
                const storagePath = params._splat;
                const url = new URL(request.url);
                const queryString = url.search;
                const body = await request.arrayBuffer();
                const contentType = request.headers.get("content-type") || "application/octet-stream";
                const response = await fetch(`${CONVEX_URL}/api/storage/${storagePath}${queryString}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": contentType,
                    },
                    body,
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    return new Response(errorText, { status: response.status });
                }
                const responseData = await response.json();
                return Response.json(responseData);
            },
        },
    },
});

export default Route;
