/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Next.js built-in gzip buffers responses before compressing, which breaks
  // SSE streaming (client only sees data once buffer fills or stream ends).
  compress: false,
};
module.exports = nextConfig;
