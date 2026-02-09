import { AdminPage } from "@/components/admin/AdminPage";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminRoute() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  // If no session, user is not authenticated
  if (!session) {
    redirect("/signin");
  }

  // Check if user is admin
  const profile = await db.query.userProfiles.findFirst({
    where: eq(schema.userProfiles.userId, session.user.id),
  });

  if (profile?.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminPage />;
}
