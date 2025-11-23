/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.usernames.app-backend.toolsforhumanity.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  reactStrictMode: false
};

export default nextConfig;
