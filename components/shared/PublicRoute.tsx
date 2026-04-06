"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Loading from "./Loading";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectAuthenticated?: boolean;
}

export default function PublicRoute({ 
  children, 
  redirectAuthenticated = true 
}: PublicRouteProps) {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (user && redirectAuthenticated) {
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/user/menu");
      }
    }
  }, [user, loading, isAdmin, router, redirectAuthenticated]);

  if (loading) {
    return <Loading />;
  }

  if (user && redirectAuthenticated) {
    return <Loading />;
  }

  return <>{children}</>;
}