"use client";

import { ProfileModal } from "@/components/profile/ProfileModal";
import { signOut, useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserProfile } from "@/hooks";
import { LogOut, Settings, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const AccountNavItem = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { data: profile } = useUserProfile();
  const isAdmin = profile?.role === "ADMIN";

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => router.push("/admin")}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
};
