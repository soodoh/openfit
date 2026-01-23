"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";

type ProviderType =
  | "google"
  | "github"
  | "facebook"
  | "discord"
  | "apple"
  | "microsoft"
  | "oidc";

interface AuthProvider {
  _id: Id<"authProviders">;
  providerId: string;
  type: ProviderType;
  displayName: string;
  enabled: boolean;
  issuer?: string;
  iconUrl?: string;
  order: number;
}

interface AuthProviderFormModalProps {
  provider: AuthProvider | null;
  isOpen: boolean;
  onClose: () => void;
}

// Provider configuration info
const PROVIDER_CONFIG: Record<
  string,
  { label: string; envVars: string[]; docUrl?: string }
> = {
  google: {
    label: "Google",
    envVars: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
    docUrl: "https://console.cloud.google.com/apis/credentials",
  },
  github: {
    label: "GitHub",
    envVars: ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"],
    docUrl: "https://github.com/settings/developers",
  },
  facebook: {
    label: "Facebook",
    envVars: ["AUTH_FACEBOOK_ID", "AUTH_FACEBOOK_SECRET"],
    docUrl: "https://developers.facebook.com/apps",
  },
  discord: {
    label: "Discord",
    envVars: ["AUTH_DISCORD_ID", "AUTH_DISCORD_SECRET"],
    docUrl: "https://discord.com/developers/applications",
  },
  apple: {
    label: "Apple",
    envVars: ["AUTH_APPLE_ID", "AUTH_APPLE_SECRET"],
    docUrl: "https://developer.apple.com/account/resources/identifiers/list",
  },
  microsoft: {
    label: "Microsoft",
    envVars: ["AUTH_MICROSOFT_ENTRA_ID_ID", "AUTH_MICROSOFT_ENTRA_ID_SECRET"],
    docUrl:
      "https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
  },
};

// OIDC config (single provider)
const OIDC_CONFIG: { label: string; envVars: string[]; docUrl?: string } = {
  label: "Generic OIDC Provider",
  envVars: ["AUTH_OIDC_ISSUER", "AUTH_OIDC_ID", "AUTH_OIDC_SECRET"],
};

export function AuthProviderFormModal({
  provider,
  isOpen,
  onClose,
}: AuthProviderFormModalProps) {
  const isEditing = provider !== null;

  const availableTypes = useQuery(
    api.queries.authProviders.getAvailableProviderTypes,
  );
  const createProvider = useMutation(
    api.mutations.authProviders.createAuthProvider,
  );
  const updateProvider = useMutation(
    api.mutations.authProviders.updateAuthProvider,
  );

  const [selectedType, setSelectedType] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (provider) {
        // Editing existing provider
        setSelectedType(`${provider.type}:${provider.providerId}`);
        setDisplayName(provider.displayName);
        setIssuer(provider.issuer || "");
        setIconUrl(provider.iconUrl || "");
        setEnabled(provider.enabled);
      } else {
        // Adding new provider
        setSelectedType("");
        setDisplayName("");
        setIssuer("");
        setIconUrl("");
        setEnabled(false);
      }
      setError(null);
    }
  }, [isOpen, provider]);

  // Update display name when type changes (for new providers)
  useEffect(() => {
    if (!isEditing && selectedType) {
      const [type] = selectedType.split(":");
      if (type === "oidc") {
        setDisplayName(OIDC_CONFIG.label);
      } else {
        setDisplayName(PROVIDER_CONFIG[type]?.label || "");
      }
    }
  }, [selectedType, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      if (isEditing && provider) {
        await updateProvider({
          id: provider._id,
          displayName,
          enabled,
          issuer: provider.type === "oidc" ? issuer : undefined,
          iconUrl: iconUrl || undefined,
        });
      } else {
        const [type, providerId] = selectedType.split(":");
        await createProvider({
          providerId,
          type: type as ProviderType,
          displayName,
          enabled,
          issuer: type === "oidc" ? issuer : undefined,
          iconUrl: iconUrl || undefined,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  // Get current provider config for env vars display
  const currentConfig = selectedType
    ? (() => {
        const [type] = selectedType.split(":");
        if (type === "oidc") {
          return OIDC_CONFIG;
        }
        return PROVIDER_CONFIG[type];
      })()
    : null;

  const isOidc = selectedType?.startsWith("oidc:");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-foreground/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-primary dark:text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? "Edit Provider" : "Add Auth Provider"}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {isEditing
                    ? "Update authentication provider settings"
                    : "Configure a new OAuth or OIDC provider"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Provider Type Selection (only for new providers) */}
            {!isEditing && (
              <div className="space-y-2">
                <Label>Provider Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes?.map((p) => (
                      <SelectItem
                        key={p.providerId}
                        value={`${p.type}:${p.providerId}`}
                      >
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Sign in with Google"
              />
              <p className="text-xs text-muted-foreground">
                Shown on the login button
              </p>
            </div>

            {/* Issuer URL (OIDC only) */}
            {isOidc && (
              <div className="space-y-2">
                <Label htmlFor="issuer">Issuer URL</Label>
                <Input
                  id="issuer"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="https://auth.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  The OIDC provider&apos;s issuer URL (e.g., Authentik,
                  Authelia, Keycloak)
                </p>
              </div>
            )}

            {/* Icon URL (optional) */}
            <div className="space-y-2">
              <Label htmlFor="iconUrl">
                Icon URL{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="iconUrl"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://example.com/icon.svg"
              />
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Show this provider on the login page
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {/* Environment Variables Info */}
            {currentConfig && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs font-medium mb-2">
                  Required Environment Variables:
                </p>
                <div className="font-mono text-xs space-y-1">
                  {currentConfig.envVars.map((envVar) => (
                    <div key={envVar} className="text-muted-foreground">
                      {envVar}
                    </div>
                  ))}
                </div>
                {currentConfig.docUrl && (
                  <a
                    href={currentConfig.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-block"
                  >
                    Provider documentation →
                  </a>
                )}
              </div>
            )}

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
              disabled={isPending || (!isEditing && !selectedType)}
              className="min-w-[100px]"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Provider"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
