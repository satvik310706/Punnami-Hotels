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
import PaymentReconciliation from "@/components/PaymentReconciliation";

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
  applicationName: "Punnami Southern Residency",
  title: {
    default: "Punnami Southern Residency Bhadrachalam | Best Hotel Stays, Luxury Rooms & Temple Lodge Booking",
    template: "%s | Punnami Southern Residency",
  },
  description:
    "Book luxury rooms at Punnami Southern Residency, the premier hotel near Bhadrachalam Temple. Experience premium amenities, family suites, AC deluxe lodging, and seamless online booking support.",
  keywords: [
    "punnami southern residency bhadrachalam",
    "best hotel in bhadrachalam near temple",
    "bhadrachalam hotel rooms booking",
    "punnami residency bhadrachalam contact number",
    "luxury stays in bhadrachalam",
    "bhadrachalam temple cottages",
    "hotels near bhadrachalam temple",
    "ac rooms in bhadrachalam",
    "family hotel bhadrachalam",
    "hotel booking bhadrachalam list",
    "punnami rooms bhadrachalam price",
    "punnami residency godavari",
    "telangana tourism hotel bhadrachalam",
    "bhadrachalam lodge online booking",
    "cheap hotels in bhadrachalam",
    "deluxe rooms bhadrachalam",
    "punnami lodge bhadrachalam room rent",
    "bhadrachalam pilgrimage rooms",
    "punnami temple residency booking"
  ],
  authors: [{ name: "Punnami Southern Residency" }],
  creator: "Satvik",
  appleWebApp: {
    capable: true,
    title: "Punnami Hotels",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://punnamihotels.com",
    title: "Punnami Southern Residency Bhadrachalam | Best Hotel Stays & Luxury Rooms",
    description: "Experience premium hospitality at Punnami Southern Residency, Bhadrachalam. Book air-conditioned family suites and executive rooms online.",
    siteName: "Punnami Southern Residency",
    images: [{
      url: "/logo.png",
      width: 1024,
      height: 1024,
      alt: "Punnami Southern Residency Logo"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Punnami Southern Residency Bhadrachalam | Best Hotel Stays",
    description: "Book executive hotel stays and premium family lodging near Bhadrachalam Temple online.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <Navbar />
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
        <PaymentReconciliation />
      </body>
    </html>
  );
}
