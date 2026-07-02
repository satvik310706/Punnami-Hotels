import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import InstallPromptModal from "@/components/InstallPromptModal";
import NavigationLoader from "@/components/NavigationLoader";
import GlobalModal from "@/components/GlobalModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://punnamihotels.com"),
  title: {
    default: "Punnami Southern Residency | Luxury Stay in Bhadrachalam",
    template: "%s | Punnami Southern Residency",
  },
  description:
    "Experience luxury and comfort at Punnami Southern Residency, Bhadrachalam. Book premium rooms with modern amenities, stunning views, and seamless online booking.",
  keywords: ["Punnami Southern Residency", "Bhadrachalam hotel", "hotel booking", "luxury stay"],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Punnami Southern Residency",
    title: "Punnami Southern Residency | Luxury Stay in Bhadrachalam",
    description: "Book premium rooms at Punnami Southern Residency — seamless booking, modern amenities.",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Punnami Southern Residency Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased min-h-screen flex flex-col bg-stone-50 text-stone-900`}
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        <div className="print:hidden">
          <Navbar />
        </div>
        <main className="flex-1">{children}</main>
        <div className="print:hidden">
          <Footer />
          <WhatsAppFAB />
        </div>
        <InstallPromptModal />
        <Suspense fallback={null}>
          <NavigationLoader />
        </Suspense>
        <GlobalModal />
      </body>
    </html>
  );
}
