"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { AuthProviderFormModal } from "./AuthProviderFormModal";
import type { Id } from "@/convex/_generated/dataModel";

// Provider type info for display
const PROVIDER_INFO: Record<
  string,
  { label: string; envVars: { id: string; secret: string; issuer?: string } }
> = {
  google: {
    label: "Google",
    envVars: { id: "AUTH_GOOGLE_ID", secret: "AUTH_GOOGLE_SECRET" },
  },
  github: {
    label: "GitHub",
    envVars: { id: "AUTH_GITHUB_ID", secret: "AUTH_GITHUB_SECRET" },
  },
  facebook: {
    label: "Facebook",
    envVars: { id: "AUTH_FACEBOOK_ID", secret: "AUTH_FACEBOOK_SECRET" },
  },
  discord: {
    label: "Discord",
    envVars: { id: "AUTH_DISCORD_ID", secret: "AUTH_DISCORD_SECRET" },
  },
  apple: {
    label: "Apple",
    envVars: { id: "AUTH_APPLE_ID", secret: "AUTH_APPLE_SECRET" },
  },
  microsoft: {
    label: "Microsoft",
    envVars: {
      id: "AUTH_MICROSOFT_ENTRA_ID_ID",
      secret: "AUTH_MICROSOFT_ENTRA_ID_SECRET",
    },
  },
};

// OIDC env vars
const OIDC_ENV_VARS = {
  id: "AUTH_OIDC_ID",
  secret: "AUTH_OIDC_SECRET",
  issuer: "AUTH_OIDC_ISSUER",
};

interface AuthProvider {
  _id: Id<"authProviders">;
  providerId: string;
  type:
    | "google"
    | "github"
    | "facebook"
    | "discord"
    | "apple"
    | "microsoft"
    | "oidc";
  displayName: string;
  enabled: boolean;
  issuer?: string;
  iconUrl?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export function AuthProvidersTable() {
  const [editProvider, setEditProvider] = useState<AuthProvider | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const providers = useQuery(api.queries.authProviders.listAuthProviders);
  const configuredProviders = useQuery(
    api.queries.authProviders.getConfiguredProviders,
  );
  const toggleProvider = useMutation(
    api.mutations.authProviders.toggleAuthProvider,
  );
  const deleteProvider = useMutation(
    api.mutations.authProviders.deleteAuthProvider,
  );

  const handleToggle = async (provider: AuthProvider, enabled: boolean) => {
    setTogglingId(provider._id);
    try {
      await toggleProvider({ id: provider._id, enabled });
    } catch (error) {
      console.error("Failed to toggle provider:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (provider: AuthProvider) => {
    if (
      !confirm(
        `Are you sure you want to delete the ${provider.displayName} provider?`,
      )
    ) {
      return;
    }

    setDeletingId(provider._id);
    try {
      await deleteProvider({ id: provider._id });
    } catch (error) {
      console.error("Failed to delete provider:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (providers === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Authentication Providers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure OAuth and OIDC providers for user authentication
            </p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No authentication providers configured</p>
              <p className="text-sm mt-1">
                Add a provider to enable OAuth login
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => {
                const providerInfo =
                  provider.type === "oidc"
                    ? { label: "OIDC", envVars: OIDC_ENV_VARS }
                    : PROVIDER_INFO[provider.type];
                const isConfigured =
                  configuredProviders?.[provider.type] ?? false;

                return (
                  <div
                    key={provider._id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                        {provider.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {provider.displayName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {providerInfo?.label || provider.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {provider.issuer && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {provider.issuer}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Env vars configuration status */}
                      <div
                        className="flex items-center gap-1 mr-2"
                        title={
                          providerInfo?.envVars
                            ? `Required: ${providerInfo.envVars.id}, ${providerInfo.envVars.secret}${providerInfo.envVars.issuer ? `, ${providerInfo.envVars.issuer}` : ""}`
                            : "Unknown provider type"
                        }
                      >
                        {isConfigured ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                        )}
                        <span
                          className={`text-xs ${isConfigured ? "text-muted-foreground" : "text-red-500 dark:text-red-400"}`}
                        >
                          {isConfigured ? "Configured" : "Missing env vars"}
                        </span>
                      </div>

                      {/* Toggle */}
                      <Switch
                        checked={provider.enabled}
                        disabled={togglingId === provider._id}
                        onCheckedChange={(checked) =>
                          handleToggle(provider, checked)
                        }
                      />

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditProvider(provider)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === provider._id}
                        onClick={() => handleDelete(provider)}
                      >
                        {deletingId === provider._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Help text about env vars */}
          <div className="mt-6 p-4 rounded-lg border border-dashed">
            <h4 className="font-medium text-sm mb-2">
              Environment Variables Required
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              For each provider to work, you must set the corresponding
              environment variables on your Convex deployment.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="font-semibold">Built-in OAuth:</span>
                <div className="text-muted-foreground">
                  AUTH_[PROVIDER]_ID
                  <br />
                  AUTH_[PROVIDER]_SECRET
                </div>
              </div>
              <div>
                <span className="font-semibold">Generic OIDC:</span>
                <div className="text-muted-foreground">
                  AUTH_OIDC_ISSUER
                  <br />
                  AUTH_OIDC_ID
                  <br />
                  AUTH_OIDC_SECRET
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AuthProviderFormModal
        provider={editProvider}
        isOpen={isAddModalOpen || editProvider !== null}
        onClose={() => {
          setEditProvider(null);
          setIsAddModalOpen(false);
        }}
      />
    </>
  );
}
