import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/signin", "/register"]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    const isAuthenticated = await convexAuth.isAuthenticated();

    // Redirect authenticated users away from auth pages
    if (isPublicRoute(request) && isAuthenticated) {
      return nextjsMiddlewareRedirect(request, "/");
    }

    // Redirect unauthenticated users to signin
    if (!isPublicRoute(request) && !isAuthenticated) {
      return nextjsMiddlewareRedirect(request, "/signin");
    }
  },
  {
    verbose: true,
    // Use internal Docker URL for server-side auth requests
    // This differs from NEXT_PUBLIC_CONVEX_URL which is for client-side
    convexUrl: process.env.CONVEX_SELF_HOSTED_URL,
  },
);

export const config = {
  // Exclude /convex/* from middleware so proxy rewrites work without auth
  matcher: ["/((?!.*\\..*|_next|convex).*)", "/", "/(api|trpc)(.*)"],
};
