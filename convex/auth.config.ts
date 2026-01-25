const authConfig = {
  providers: [
    {
      // Must match the issuer in JWT tokens, which uses CONVEX_SITE_URL
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
