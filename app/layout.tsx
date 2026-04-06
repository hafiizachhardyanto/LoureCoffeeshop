import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { NetworkProvider } from "@/context/NetworkContext";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Loure Coffee Shop",
    template: "%s | Loure Coffee Shop",
  },
  description: "Premium Coffee Experience - Nikmati kopi berkualitas dengan biji pilihan terbaik",
  keywords: ["coffee", "kopi", "coffeeshop", "loure", "premium coffee"],
  authors: [{ name: "Loure Coffee Shop" }],
  openGraph: {
    title: "Loure Coffee Shop",
    description: "Premium Coffee Experience",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1e3a8a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="loure">
      <body className={inter.className}>
        <ErrorBoundary>
          <NetworkProvider>
            <AuthProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </AuthProvider>
          </NetworkProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}