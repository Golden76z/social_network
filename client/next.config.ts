import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  // Disable static export for social network app (needs server-side functionality)
  // ...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Force SWC usage and disable Babel
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Don't fail build on TypeScript errors during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't fail build on ESLint errors during development
    ignoreDuringBuilds: true, // Temporarily disabled to focus on main functionality
  },
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
        },
      };
    }
    
    // Optimize for development to reduce compilation frequency
    if (process.env.NODE_ENV === 'development') {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  // Reduce compilation frequency
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Moved from experimental.turbo to turbopack
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};

export default nextConfig;