/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@crm/db"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
