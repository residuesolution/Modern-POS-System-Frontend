"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCurrentUser } from "../services/authService";

type UserWithRole = { role?: string | null };

export default function AdminSidebar({ active }: { active: string }) {
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
      {/* Header with logo */}
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
            <Link href="/dashboard">
              <div
                className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  active === "dashboard" 
                    ? "bg-orange-100 text-orange-800 font-semibold" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Dashboard
              </div>
            </Link>
          </li>
          
          <li>
            <Link href="/admin/analysis">
              <div
                className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  active === "analysis" 
                    ? "bg-orange-100 text-orange-800 font-semibold" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analysis
              </div>
            </Link>
          </li>

          <li>
            <Link href="/admin/product/view">
              <div
                className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  active === "product-view" || active === "inventory"
                    ? "bg-blue-500 text-white font-semibold shadow-lg" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Inventory
              </div>
            </Link>
          </li>

          <li>
            <Link href="/admin/customer/view">
              <div
                className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  active === "customer-view" 
                    ? "bg-orange-100 text-orange-800 font-semibold" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Customers
              </div>
            </Link>
          </li>

          <li>
            <Link href="/admin/help">
              <div
                className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                  active === "help" 
                    ? "bg-orange-100 text-orange-800 font-semibold" 
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </div>
            </Link>
          </li>

          {/* Admin-only sections */}
          {role === "ADMIN" && (
            <>
              <li className="pt-4">
                <div className="text-xs text-gray-500 uppercase font-semibold px-4 mb-2">Admin Only</div>
              </li>
              <li>
                <Link href="/admin/hardware-status">
                  <div
                    className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      active === "hardware" 
                        ? "bg-orange-100 text-orange-800 font-semibold" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Hardware Status
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/admin/system-configuration">
                  <div
                    className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      active === "system" 
                        ? "bg-orange-100 text-orange-800 font-semibold" 
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    System Configuration
                  </div>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-2">
        <Link href="/admin/settings">
          <div className="flex items-center px-4 py-2 text-gray-600 cursor-pointer hover:bg-gray-50 rounded-xl transition-all">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </div>
        </Link>
        <button 
          onClick={() => {
            // Add your logout logic here
            if (typeof window !== 'undefined') {
              localStorage.removeItem('authToken');
              window.location.href = '/login';
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