import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Fabhouse — Find a Place That Feels Right",
  description:
    "Find property with clear details and a direct line to local professionals. Fabhouse is growing across African markets and beyond; availability varies by location.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fabhouse",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a3a52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cream text-navy flex flex-col min-h-screen`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try { const saved = localStorage.getItem("fabhouse-theme"); const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.classList.toggle("dark", dark); } catch {}`}
        </Script>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
