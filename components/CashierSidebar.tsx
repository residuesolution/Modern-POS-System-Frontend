"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCurrentUser } from "../services/authService";

type UserWithRole = { role?: string | null };

export default function CashierSidebar({ active }: { active: string }) {
  const [role, setRole] = useState<string | null>(null);

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

  return (
    <div className="fixed top-0 left-0 h-screen w-60 bg-white shadow-lg flex flex-col border-r border-gray-200 z-20">
      {/* Header */}
      <div className="flex items-center px-6 py-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5a1 1 0 001 1.2h9.2M7 13v6a2 2 0 002 2h2M9 19v2m4-2v2" />
            </svg>
          </div>
          <span className="text-xl font-bold text-blue-600">SwiftCart</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          <li>
            <Link href="/cashier">
              <div className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${active === "dashboard" ? "bg-orange-100 text-orange-800 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4V6H3v4zm0 8h4v-4H3v4zm6 0h12v-4H9v4zm0-8h12V6H9v4z" />
                </svg>
                Dashboard
              </div>
            </Link>
          </li>

          <li>
            <Link href="/cashier/customers">
              <div className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${active === "customers" ? "bg-orange-100 text-orange-800 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Customers
              </div>
            </Link>
          </li>

          <li>
            <Link href="/cashier/profile">
              <div className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${active === "profile" ? "bg-orange-100 text-orange-800 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14v7" />
                </svg>
                Profile
              </div>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <Link href="/cashier/settings">
          <div className="flex items-center px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-xl transition-all">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
            </svg>
            Settings
          </div>
        </Link>

        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              localStorage.removeItem("authToken");
              window.location.href = "/login";
            }
          }}
          className="flex items-center px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-xl transition-all w-full text-left"
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log Out
        </button>
      </div>
    </div>
  );
}
