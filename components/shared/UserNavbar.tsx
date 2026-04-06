"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function UserNavbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

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
          
          <Link href="/user/checkout" className="btn btn-ghost text-white hover:bg-white/20">
            <div className="indicator">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="badge badge-sm badge-error indicator-item">{totalItems}</span>
              )}
            </div>
          </Link>

          <Link href="/user/waiting" className="btn btn-ghost text-white hover:bg-white/20">
            Pesanan
          </Link>

          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar placeholder">
              <div className="bg-white text-blue-900 rounded-full w-10">
                <span className="text-xl">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 p-2 shadow menu menu-compact dropdown-content bg-white rounded-box w-52">
              <li className="px-4 py-2 text-sm text-gray-500">
                {user?.name}
              </li>
              <li><Link href="/user/profile">Profil</Link></li>
              <li><button onClick={logout}>Keluar</button></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}