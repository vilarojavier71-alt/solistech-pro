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
  // Security headers configuration (ISO 27001 A.8.28)
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    
    const securityHeaders = [
      {
        key: 'Strict-Transport-Security',
        value: isProduction
          ? 'max-age=31536000; includeSubDomains; preload'
          : 'max-age=86400',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=(), payment=(self)',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://api.stripe.com https://*.sentry.io https://re.jrc.ec.europa.eu",
          "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "upgrade-insecure-requests"
        ].join('; '),
      },
    ]
    
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
      {
        // Aplicar a todas las rutas
        source: '/:path*',
        headers: securityHeaders,
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

