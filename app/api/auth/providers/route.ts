import { NextResponse } from "next/server";

export async function GET() {
  // Check which OAuth providers are configured via environment variables
  const providerStatus = {
    google: Boolean(
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
    ),
    github: Boolean(
      process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
    ),
    discord: Boolean(
      process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET,
    ),
    oidc: Boolean(
      process.env.AUTH_OIDC_CLIENT_ID &&
      process.env.AUTH_OIDC_CLIENT_SECRET &&
      process.env.AUTH_OIDC_ISSUER,
    ),
  };

  return NextResponse.json(providerStatus);
}
