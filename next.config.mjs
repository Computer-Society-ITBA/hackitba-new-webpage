/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["tsx"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
