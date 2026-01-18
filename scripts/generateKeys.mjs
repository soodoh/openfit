import { randomBytes } from "crypto";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", {
  extractable: true,
});
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });
const instanceSecret = randomBytes(32).toString("hex");

// Format private key as single line (spaces instead of newlines)
const privateKeyOneLine = privateKey.trimEnd().replace(/\n/g, " ");

console.log(`
================================================================================
  Open Fit - Environment Variables
================================================================================

Copy the following into your .env file or docker-compose.yml environment section:

# Convex Configuration
INSTANCE_SECRET='${instanceSecret}'
JWT_PRIVATE_KEY='${privateKeyOneLine}'
JWKS='${jwks}'

# Public URL for browser to connect to Convex (change if using reverse proxy)
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210

================================================================================
  Generate Admin Key
================================================================================

Run this command to generate the admin key (uses the INSTANCE_SECRET above):

docker run --rm -e INSTANCE_SECRET='${instanceSecret}' \\
  --entrypoint ./generate_admin_key.sh \\
  ghcr.io/get-convex/convex-backend:latest

Then add the output to your environment:

CONVEX_SELF_HOSTED_ADMIN_KEY='<paste-output-here>'

================================================================================
`);
