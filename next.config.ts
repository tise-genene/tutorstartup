import type { NextConfig } from "next";

// Prevent `next/font/google` from fetching fonts during `next build`.
// This avoids build failures in offline/restricted environments.
process.env.NEXT_FONT_GOOGLE_DISABLE_DOWNLOAD ??= "1";

const nextConfig: NextConfig = {
  transpilePackages: ["@tutorstartup/shared"],
};

export default nextConfig;
