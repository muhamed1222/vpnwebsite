import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  compiler: {
    // Удаляем console.log в production, оставляем только error и warn
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // Оптимизация производительности
  // swcMinify удален - это опция по умолчанию в Next.js 16+
  poweredByHeader: false,
  compress: true,
  // Оптимизация изображений
  images: {
    // Форматы изображений для оптимизации
    formats: ['image/avif', 'image/webp'],
    // Разрешенные домены для внешних изображений
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Минимальные размеры для оптимизации
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Качество изображений
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://telegram.org https://app.request.finance" + ((process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') ? " https://vercel.live" : ""),
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.outlivion.space https://vpn.outlivion.space https://plausible.io" + ((process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development') ? " https://vercel.live wss://*.vercel.live" : ""),
              "frame-src 'self' https://telegram.org https://app.request.finance",
              "frame-ancestors https://*.telegram.org https://web.telegram.org https://*.t.me",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "outcasts-3d",

  project: "javascript",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
