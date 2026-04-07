import { AlertCircle, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Role, RoleEnum } from "@/db/schema/user-data";
import type { UserWithProfile } from "@/hooks";
import { useUpdateUserRole } from "@/hooks";

type UserRoleModalProps = {
	user: UserWithProfile | undefined;
	onClose: () => void;
};

function isRole(value: string): value is Role {
	return value === RoleEnum.USER || value === RoleEnum.ADMIN;
}

export function UserRoleModal({ user, onClose }: UserRoleModalProps) {
	const open = Boolean(user);
	const updateUserRoleMutation = useUpdateUserRole();
	const [role, setRole] = useState<Role>(RoleEnum.USER);
	const [error, setError] = useState<string | undefined>(undefined);
	const [isPending, setIsPending] = useState(false);
	// Reset form when modal opens
	useEffect(() => {
		if (open && user) {
			setRole(user.role);
			setError(undefined);
		}
	}, [open, user]);
	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!user) {
			return;
		}
		setError(undefined);
		setIsPending(true);
		try {
			await updateUserRoleMutation.mutateAsync({
				id: user.id,
				role,
			});
			onClose();
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Failed to update role",
			);
		} finally {
			setIsPending(false);
		}
	};
	const handleClose = () => {
		setError(undefined);
		onClose();
	};
	const hasChanged = user?.role !== role;
	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[400px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader className="pb-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
								<Shield className="h-5 w-5 text-primary dark:text-foreground" />
							</div>
							<div>
								<DialogTitle className="text-xl">Change User Role</DialogTitle>
								<DialogDescription className="text-sm">
									Update role for {user?.email}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="py-4 space-y-4">
						<div className="space-y-2">
							<Label>Role</Label>
							<Select
								value={role}
								onValueChange={(value) => {
									if (isRole(value)) {
										setRole(value);
									}
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="USER">User</SelectItem>
									<SelectItem value="ADMIN">Admin</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{role === "ADMIN"
									? "Admins can manage all global data and users"
									: "Users can only manage their own data"}
							</p>
						</div>

						{error && (
							<p className="text-sm text-destructive flex items-center gap-1.5">
								<AlertCircle className="h-3.5 w-3.5" />
								{error}
							</p>
						)}
					</div>

					<DialogFooter className="pt-4 border-t border-border/50">
						<Button type="button" variant="ghost" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isPending || !hasChanged}
							className="min-w-[100px]"
						>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
export default UserRoleModal;
