/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@altered/cards"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "altered-dev.s3.eu-west-3.amazonaws.com" },
      { protocol: "https", hostname: "altered-prod-eu.s3.eu-west-3.amazonaws.com" },
    ],
  },
};

export default nextConfig;
