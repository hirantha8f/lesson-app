/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Clickjacking: app has no embed use-case.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No Permissions-Policy lock-in yet (classroom video/mic may come later).
          // NOTE: no script-src CSP — the JS playground intentionally uses
          // `new Function`, which requires 'unsafe-eval' and would neuter a
          // CSP. Sandboxing the runner (iframe/Worker) is the tracked fix
          // before any script-src policy lands.
        ],
      },
    ];
  },
};
module.exports = nextConfig;
