
import { useAuth } from "@/components/providers/AuthProvider";
import { useUserProfile } from "@/hooks";
import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Syncs the user's theme preference from the database to next-themes.
 * This runs when the user is authenticated and their profile is loaded.
 */
export function ThemeSync() {
  const { isAuthenticated } = useAuth();
  const { data: profile } = useUserProfile();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated && profile?.theme) {
      setTheme(profile.theme);
    }
  }, [isAuthenticated, profile?.theme, setTheme]);

  return null;
}
