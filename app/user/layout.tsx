import { ReactNode } from "react";
import UserNavbar from "@/components/shared/UserNavbar";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <div className="min-h-screen flex flex-col bg-base-100">
        <UserNavbar />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}