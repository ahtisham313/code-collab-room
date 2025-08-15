// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  
  // Enable React 18 features
  reactStrictMode: true,
  
  // Configure webpack for Monaco Editor
  webpack: (config: { module: { rules: { test: RegExp; type: string; }[]; }; resolve: { fallback: any; }; }, { isServer }: any) => {
    // Monaco Editor configuration
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource',
    });

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-domain.herokuapp.com'  // Replace with your deployed backend URL
      : 'http://localhost:5000',
  },

  // Headers for CORS
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Images configuration
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression
  compress: true,

  // Performance optimizations
  poweredByHeader: false,
  
  // Static file serving
  trailingSlash: false,

  // ESLint configuration
  eslint: {
    dirs: ['src'],
  },

  // TypeScript configuration
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
}

module.exports = nextConfig