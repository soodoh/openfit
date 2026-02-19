/* eslint-disable eslint-plugin-import(prefer-default-export), eslint-plugin-promise(always-return), eslint-plugin-promise(prefer-await-to-then), typescript-eslint(no-restricted-types), typescript-eslint(no-use-before-define) */
import { AdminPage } from "@/components/admin/admin-page";
import { useAuth } from "@/components/providers/auth-provider";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/signin" });
      return;
    }

    if (isAuthenticated) {
      fetch("/api/admin/check")
        .then((res) => {
          if (!res.ok) {
            navigate({ to: "/" });
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (data?.isAdmin) {
            setIsAdmin(true);
          } else {
            navigate({ to: "/" });
          }
        })
        .catch(() => {
          navigate({ to: "/" });
        });
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <AdminPage />;
}
