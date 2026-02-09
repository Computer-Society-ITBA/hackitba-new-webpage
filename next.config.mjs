/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["tsx"],
  output: 'export',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
