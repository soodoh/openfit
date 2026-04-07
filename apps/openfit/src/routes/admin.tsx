import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPage } from "@/components/admin/admin-page";
import { useAuth } from "@/components/providers/auth-provider";
import { parseResponseJson } from "@/lib/request-helpers";

function AdminRoute() {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
	useEffect(() => {
		if (!authLoading && !isAuthenticated) {
			void navigate({ to: "/signin" });
			return;
		}
		if (!isAuthenticated) {
			return;
		}
		const checkAdmin = async () => {
			try {
				const res = await fetch("/api/admin/check");
				if (!res.ok) {
					void navigate({ to: "/" });
					return;
				}
				const data = await parseResponseJson<{ isAdmin?: boolean }>(res);
				if (data?.isAdmin) {
					setIsAdmin(true);
					return;
				}
				setIsAdmin(false);
				void navigate({ to: "/" });
			} catch {
				setIsAdmin(false);
				void navigate({ to: "/" });
			}
		};
		void checkAdmin();
	}, [authLoading, isAuthenticated, navigate]);
	if (authLoading || isAdmin === undefined) {
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
export const Route = createFileRoute("/admin")({
	component: AdminRoute,
});
export default Route;
