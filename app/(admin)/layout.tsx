import { ReactNode } from "react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-base-100 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col ml-64">
          <AdminNavbar />
          <main className="flex-grow p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}