import { ReactNode } from "react";
import PublicNavbar from "@/components/shared/PublicNavbar";
import Footer from "@/components/shared/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}