import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBT Fakultas Kedokteran",
  description: "Computer-Based Test untuk Fakultas Kedokteran",
};

export const viewport: Viewport = {
  themeColor: "#0e4c44",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Font dimuat via <link> (bukan next/font) agar build tidak bergantung
            pada akses Google Fonts saat build-time. Di lingkungan dev/produksi
            biasa, font tetap dimuat normal oleh browser. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
