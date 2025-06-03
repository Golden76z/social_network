// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export', // Required for static export
  distDir: 'dist', // Changed from default 'out' to match your Electron config
  images: {
    unoptimized: true, // Required for static export
  },
}

export default nextConfig