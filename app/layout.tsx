import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { NetworkProvider } from "@/context/NetworkContext";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import PublicNavbar from "@/components/shared/PublicNavbar";
import Footer from "@/components/shared/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Loure Coffee Shop",
    template: "%s | Loure Coffee Shop",
  },
  description: "Premium Coffee Experience",
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
                <div className="min-h-screen flex flex-col">
                  <PublicNavbar />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                </div>
              </CartProvider>
            </AuthProvider>
          </NetworkProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}