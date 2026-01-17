/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Build paytida lint xatolarini yashirmaymiz: production sifati uchun.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Type xatolarni ham yashirmaymiz.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
