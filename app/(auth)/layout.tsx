import { ReactNode } from "react";
import Link from "next/link";
import PublicRoute from "@/components/shared/PublicRoute";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PublicRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <Link href="/" className="flex items-center gap-3 text-white hover:text-blue-200 transition-colors">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold">LOURE.</span>
          </Link>
        </div>
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </PublicRoute>
  );
}