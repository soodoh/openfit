/* eslint-disable eslint(no-console), eslint-plugin-import(prefer-default-export), eslint-plugin-promise(prefer-await-to-then), eslint-plugin-unicorn(filename-case), typescript-eslint(explicit-module-boundary-types), typescript-eslint(no-restricted-types) */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

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
  discord: {
    label: "Discord",
    envVars: { id: "AUTH_DISCORD_ID", secret: "AUTH_DISCORD_SECRET" },
  },
  oidc: {
    label: import.meta.env.VITE_AUTH_OIDC_PROVIDER_NAME || "OIDC",
    envVars: {
      id: "AUTH_OIDC_CLIENT_ID",
      secret: "AUTH_OIDC_CLIENT_SECRET",
      issuer: "AUTH_OIDC_ISSUER",
    },
  },
};

type ProviderStatus = {
  google: boolean;
  github: boolean;
  discord: boolean;
  oidc: boolean;
}

export function AuthProvidersTable() {
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(
    null,
  );

  useEffect(() => {
    // Fetch configured provider status from API
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then(setProviderStatus)
      .catch(console.error);
  }, []);

  const providers = Object.entries(PROVIDER_INFO).map(([key, info]) => ({
    id: key,
    displayName: info.label,
    type: key as keyof typeof PROVIDER_INFO,
    envVars: info.envVars,
    isConfigured: providerStatus?.[key as keyof ProviderStatus] ?? false,
  }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Authentication Providers</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            OAuth providers are configured via environment variables
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                  {provider.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{provider.displayName}</span>
                    <Badge variant="outline" className="text-xs">
                      OAuth
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Requires: {provider.envVars.id}, {provider.envVars.secret}
                    {provider.envVars.issuer && `, ${provider.envVars.issuer}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {provider.isConfigured ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">
                      Configured
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Not configured
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Help text about env vars */}
        <div className="mt-6 p-4 rounded-lg border border-dashed">
          <h4 className="font-medium text-sm mb-2">
            How to Configure Providers
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Set the environment variables in your .env file or Docker
            configuration to enable OAuth providers.
          </p>
          <div className="text-xs font-mono text-muted-foreground">
            <p>AUTH_GOOGLE_ID=your-google-client-id</p>
            <p>AUTH_GOOGLE_SECRET=your-google-client-secret</p>
            <p className="mt-2">AUTH_GITHUB_ID=your-github-client-id</p>
            <p>AUTH_GITHUB_SECRET=your-github-client-secret</p>
            <p className="mt-2">AUTH_DISCORD_ID=your-discord-client-id</p>
            <p>AUTH_DISCORD_SECRET=your-discord-client-secret</p>
            <p className="mt-2">AUTH_OIDC_CLIENT_ID=your-oidc-client-id</p>
            <p>AUTH_OIDC_CLIENT_SECRET=your-oidc-client-secret</p>
            <p>AUTH_OIDC_ISSUER=https://auth.example.com</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
