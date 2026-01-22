"use client";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPage } from "@/components/admin/AdminPage";

export default function AdminRoute() {
  return (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  );
}
