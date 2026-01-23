"use client";

import Image, { ImageProps } from "next/image";

/**
 * Check if a URL points to a private/local IP address.
 * Next.js Image optimization blocks these for security.
 */
function isPrivateUrl(src: string): boolean {
  try {
    const url = new URL(src);
    const hostname = url.hostname;
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")
    );
  } catch {
    return false;
  }
}

/**
 * Image component for Convex storage URLs.
 * Automatically uses unoptimized mode for private/local URLs
 * to work around Next.js SSRF protection.
 */
export function ConvexImage({ src, unoptimized, ...props }: ImageProps) {
  const srcString = typeof src === "string" ? src : "";
  const shouldSkipOptimization = unoptimized || isPrivateUrl(srcString);

  return <Image src={src} unoptimized={shouldSkipOptimization} {...props} />;
}
