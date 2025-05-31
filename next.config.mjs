/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mui/material", "@mui/x-date-pickers"],
  experimental: {
    esmExternals: "loose",
  },
};

export default nextConfig;
