import { AdminPage } from "@/components/admin/AdminPage";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function AdminRoute() {
  const token = await convexAuthNextjsToken();
  const isAdmin = await fetchQuery(
    api.queries.userProfiles.isAdmin,
    {},
    { token },
  );

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminPage />;
}
