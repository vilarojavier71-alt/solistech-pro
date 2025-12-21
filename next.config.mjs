import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // === MEMORY OPTIMIZATION ===
  // Disable source maps to reduce memory during build
  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint during build to save memory
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Fix for @react-pdf/renderer in Next.js 14+
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    // Enable instrumentation for Sentry
    instrumentationHook: true,
  },
  // PWA headers configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // Enable WebAssembly support for Prisma query engine and handle react-pdf canvas
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    // Fix for @react-pdf/renderer requiring canvas
    config.resolve.alias.canvas = false;

    return config;
  },
};

// Wrapper de Sentry - solo aplica si existe DSN
const sentryConfig = {
  // Organización y proyecto (configurar en .env)
  org: process.env.SENTRY_ORG || 'motorgap',
  project: process.env.SENTRY_PROJECT || 'motorgap-pro',

  // Solo subir source maps, no exponerlos al cliente
  silent: true,
  hideSourceMaps: true,

  // Desactivar telemetría
  telemetry: false,

  // Desactivar verificación de source maps en build (evita errores si no hay token)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
};

// Exportar config envuelta con Sentry (solo si SDK está disponible)
export default withSentryConfig(nextConfig, sentryConfig);

