// For self-hosted Docker setup:
// CONVEX_SITE_ORIGIN points to HTTP actions port (3211), accessible from both host and container
// This allows OIDC discovery to work without proxy complexity
const authConfig = {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
