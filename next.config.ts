import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for nodemailer on Vercel edge
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
