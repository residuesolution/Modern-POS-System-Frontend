"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, logoutUser } from "../services/authService";

type UserWithRole = { role?: string | null };

export default function AdminSidebar({ active }: { active: string }) {
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function getUserRole() {
      try {
        const userData = await fetchCurrentUser();
        const user =
          userData && typeof userData === "object" && "user" in userData && userData.user
            ? userData.user
            : userData && typeof userData === "object" && "data" in userData && userData.data
            ? userData.data
            : userData;
        setRole((user as UserWithRole)?.role || null);
      } catch {
        setRole(null);
      }
    }
    getUserRole();
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push("/auth/login");
  };

  // SVG icons for sidebar (updated as requested)
  const icons = {
    dashboard: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="#4097c0"/></svg>
    ),
    analysis: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M3 17h2v-7H3v7zm4 0h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-2h-2v2z" fill="#4097c0"/></svg>
    ),
    inventory: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M20 6H4V4h16v2zm0 2v12H4V8h16zm-2 2H6v8h12v-8z" fill="#4097c0"/></svg>
    ),
    customers: (
      // Group icon for customers (multiple people)
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="7" cy="10" r="3" fill="#4097c0"/>
        <circle cx="17" cy="10" r="3" fill="#4097c0"/>
        <ellipse cx="7" cy="17" rx="5" ry="3" fill="#b3e0f7"/>
        <ellipse cx="17" cy="17" rx="5" ry="3" fill="#b3e0f7"/>
      </svg>
    ),
    hardware: (
      // New hardware status icon (chip style)
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="5" y="5" width="14" height="14" rx="2" fill="#4097c0"/>
        <rect x="9" y="9" width="6" height="6" rx="1" fill="#fff"/>
        <path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="#4097c0" strokeWidth="1.5"/>
      </svg>
    ),
    system: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 1112 8a3.5 3.5 0 010 7.5zm7.94-2.34l-1.43-1.43a7.007 7.007 0 00.01-2.46l1.43-1.43a.996.996 0 00-.01-1.41l-2.12-2.12a.996.996 0 00-1.41-.01l-1.43 1.43a7.007 7.007 0 00-2.46-.01l-1.43-1.43a.996.996 0 00-1.41.01l-2.12 2.12a.996.996 0 00-.01 1.41l1.43 1.43a7.007 7.007 0 00-.01 2.46l-1.43 1.43a.996.996 0 00.01 1.41l2.12 2.12a.996.996 0 001.41.01l1.43-1.43a7.007 7.007 0 002.46.01l1.43 1.43a.996.996 0 001.41-.01l2.12-2.12a.996.996 0 00.01-1.41z" fill="#4097c0"/></svg>
    ),
    help: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#4097c0" strokeWidth="2"/><path d="M12 17h.01M12 13a2 2 0 10-2-2" stroke="#4097c0" strokeWidth="2" strokeLinecap="round"/></svg>
    ),
    settings: (
      // Classic gear icon
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" stroke="#4097c0" strokeWidth="2"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#4097c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    logout: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path d="M16 17v1a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2h7a2 2 0 012 2v1M7 12h12m-3-3l3 3-3 3" stroke="#4097c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-20 transition-all duration-300 
        ${open ? "w-64" : "w-16"} 
        bg-white shadow-xl flex flex-col rounded-br-xl rounded-tr-xl`}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center space-x-2">
          {open && (
          <Link href="/dashboard">
            <img src="/images/img2.png" alt="SwiftCart Logo" className="w-50 h-25" />
          </Link>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[#4097c0] text-2xl focus:outline-none"
        >
          {open ? "≡" : "☰"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-4">
          <li>
            <Link href="/dashboard">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
                ${active === "dashboard" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
              >
                <span className="mr-3">{icons.dashboard}</span>
                {open && "Dashboard"}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/analysis">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
                ${active === "analysis" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}

              >
                <span className="mr-3">{icons.analysis}</span>
                {open && "Analysis"}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/inventory">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg
                ${active === "inventory" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}

              >
                <span className="mr-3">{icons.inventory}</span>
                {open && "Inventory"}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/customers">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
               ${active === "customers" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}

              >
                <span className="mr-3">{icons.customers}</span>
                {open && "Customers"}
              </div>
            </Link>
          </li>
          {role === "ADMIN" && (
            <>
              <li>
                <Link href="/admin/hardware-status">
                  <div
                    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
                    ${active === "hardware" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
                  >
                    <span className="mr-3">{icons.hardware}</span>
                    {open && "Hardware Status"}
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/admin/system-configuration">
                  <div
                    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
                    ${active === "system" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
                  >
                    <span className="mr-3">{icons.system}</span>
                    {open && "System Configuration"}
                  </div>
                </Link>
              </li>
            </>
          )}
          <li>
            <Link href="/help">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg
                   ${active === "help" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
              >
                <span className="mr-3">{icons.help}</span>
                {open && "Help"}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/settings">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg
                   ${active === "settings" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
              >
                <span className="mr-3">{icons.settings}</span>
                {open && "Settings"}
              </div>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4 py-7 border-t text-xs flex flex-col gap-2">
        <div
          className="cursor-pointer hover:text-blue-900 flex items-center text-blue-800"
          onClick={handleLogout}
        >
          <span className="mr-2">{icons.logout}</span> {open && "Log Out"}
        </div>
      </div>
    </div>
  );
}