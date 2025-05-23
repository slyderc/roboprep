/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  env: {
    OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    OPENAI_MODEL: process.env.NEXT_PUBLIC_OPENAI_MODEL,
    OPENAI_MAX_TOKENS: process.env.NEXT_PUBLIC_OPENAI_MAX_TOKENS,
    OPENAI_TEMPERATURE: process.env.NEXT_PUBLIC_OPENAI_TEMPERATURE,
  },
  // Silence build warnings 
  eslint: {
    ignoreDuringBuilds: true, 
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Settings for auth-based app (uses cookies and dynamic routes)
  trailingSlash: false,
  poweredByHeader: false
}

module.exports = nextConfig