"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "./Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("user" | "admin")[];
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ["user", "admin"] 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAdmin } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
      return;
    }

    if (allowedRoles.includes("admin") && !allowedRoles.includes("user")) {
      if (!isAdmin) {
        router.push("/menu");
        return;
      }
    }

    setIsAuthorized(true);
  }, [user, loading, isAdmin, router, pathname, allowedRoles]);

  if (loading || !isAuthorized) {
    return <Loading />;
  }

  return <>{children}</>;
}