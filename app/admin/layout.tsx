"use client";
import { usePathname } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  let active = "";

  if (pathname.includes("hardware-status")) active = "hardware";
  else if (pathname.includes("system-configuration")) active = "system";
  else if (pathname.includes("dashboard")) active = "dashboard";
  

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-blue-400 to-blue-700">
      {/* Sidebar */}
      <Sidebar active={active} />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:ml-64 transition-all">
        {children}
      </main>
    </div>
  );
}
