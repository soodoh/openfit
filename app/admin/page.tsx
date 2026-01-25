import { AdminPage } from "@/components/admin/AdminPage";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

// Server-side URL for Convex (may differ from client URL in self-hosted setups)
const convexUrl =
  process.env.CONVEX_SELF_HOSTED_URL || process.env.NEXT_PUBLIC_CONVEX_URL!;

export default async function AdminRoute() {
  const token = await convexAuthNextjsToken();

  // If no token, user is not authenticated
  if (!token) {
    redirect("/");
  }

  const isAdmin = await fetchQuery(
    api.queries.userProfiles.isAdmin,
    {},
    { token, url: convexUrl },
  );

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminPage />;
}
