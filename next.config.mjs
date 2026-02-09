/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  pageExtensions: ["tsx"],
  // output: 'export', // Temporalmente deshabilitado por conflicto con generateStaticParams
  images: {
    unoptimized: true,
  },
}

export default nextConfig
