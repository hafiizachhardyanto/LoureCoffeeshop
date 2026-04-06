"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function PublicNavbar() {
  const { user, isAdmin } = useAuth();

  return (
    <nav className="navbar sticky top-0 z-40 shadow-lg">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <span className="text-2xl font-bold" style={{ color: '#3b4cca' }}>L</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">LOURE.</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/user/menu" className="btn btn-ghost text-white">
            Menu
          </Link>
          
          {user ? (
            <>
              {isAdmin ? (
                <Link href="/admin/dashboard" className="btn btn-ghost text-white">
                  Dashboard
                </Link>
              ) : (
                <Link href="/user/checkout" className="btn btn-ghost text-white">
                  Keranjang
                </Link>
              )}
              <Link href="/user/profile" className="btn btn-ghost text-white">
                Profil
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn bg-white hover:opacity-90 font-medium" style={{ color: '#3b4cca' }}>
                Masuk
              </Link>
              <Link href="/auth/register" className="btn btn-outline">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}