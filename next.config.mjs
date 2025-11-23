/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true,
    domains: ['static.usernames.app-backend.toolsforhumanity.com']
  },
  reactStrictMode: false, // Required for MiniKit to prevent double-mounting
  allowedDevOrigins: process.env.NODE_ENV === 'development' ? ['*'] : [] // For local development
};

export default nextConfig;
