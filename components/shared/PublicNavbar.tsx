"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function PublicNavbar() {
  const { user, isAdmin } = useAuth();

  return (
    <nav className="navbar bg-primary text-white sticky top-0 z-40 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex-1">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-900 font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold">LOURE.</span>
          </Link>
        </div>
        <div className="flex-none gap-4">
          <Link href="/user/menu" className="btn btn-ghost text-white hover:bg-white/20">
            Menu
          </Link>
          
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin/dashboard" className="btn btn-ghost text-white hover:bg-white/20">
                  Dashboard
                </Link>
              ) : (
                <Link href="/user/checkout" className="btn btn-ghost text-white hover:bg-white/20">
                  Keranjang
                </Link>
              )}
              <Link href="/user/profile" className="btn btn-ghost text-white hover:bg-white/20">
                Profil
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn bg-white text-blue-900 hover:bg-blue-50 border-0 font-medium">
                Masuk
              </Link>
              <Link href="/auth/register" className="btn btn-outline border-white text-white hover:bg-white hover:text-blue-900 font-medium">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}