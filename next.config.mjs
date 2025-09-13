/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable tracing to avoid Windows permission issues
  experimental: {
    // Disable instrumentation
  },
  // Disable webpack logging that causes trace file creation
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' }
    return config
  },
}

export default nextConfig
