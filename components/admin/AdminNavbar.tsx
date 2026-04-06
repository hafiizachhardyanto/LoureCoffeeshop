"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminNavbar() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-blue-900">
          Selamat Datang, {user?.name}
        </h1>
        <p className="text-sm text-gray-500">
          {currentTime.toLocaleDateString("id-ID", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <Link 
          href="/profile" 
          className="btn btn-ghost btn-sm"
        >
          Profil
        </Link>
      </div>
    </header>
  );
}