/** @type {import('next').NextConfig} */

/**
 * Security headers applied to every response.
 *
 * These protect against clickjacking (X-Frame-Options), MIME-type sniffing
 * (X-Content-Type-Options), information leakage via the Referer header,
 * and enforce HTTPS (HSTS).  The Content-Security-Policy restricts resource
 * loading to trusted origins required by Supabase, Google, and Microsoft OAuth.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js dev + runtime requires eval and inline scripts
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // Allow Google Fonts stylesheets and inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Allow Google Fonts files
      "font-src 'self' https://fonts.gstatic.com",
      // Allow images from Supabase storage and data/blob URIs
      "img-src 'self' data: blob: https://*.supabase.co",
      // Allow API calls to Supabase and OAuth providers
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com https://login.microsoftonline.com",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,

  // Performance: compress responses
  compress: true,

  // Performance: generate source maps only in production for debugging
  productionBrowserSourceMaps: false,

  // Performance: optimize images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  webpack: (config, { dev, isServer }) => {
    if (dev && process.platform === "win32") {
      config.cache = false;
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
