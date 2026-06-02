/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Saat backend Python sudah siap, tambahkan host gambar soal di sini.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
