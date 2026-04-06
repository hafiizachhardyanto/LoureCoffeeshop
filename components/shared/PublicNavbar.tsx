"use client";

import Link from "next/link";
import Image from "next/image";

export default function PublicNavbar() {
  return (
    <nav className="navbar navbar-loure sticky top-0 z-40 shadow-lg">
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
          <Link href="/menu" className="btn btn-ghost text-white">
            Menu
          </Link>
          <Link href="/login" className="btn bg-white text-blue-900 hover:bg-blue-50 border-0">
            Masuk
          </Link>
          <Link href="/register" className="btn btn-outline border-white text-white hover:bg-white hover:text-blue-900">
            Daftar
          </Link>
        </div>
      </div>
    </nav>
  );
}