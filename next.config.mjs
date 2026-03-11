/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["tsx"],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
