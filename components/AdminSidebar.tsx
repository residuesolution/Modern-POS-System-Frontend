"use client";
import { useState } from "react";
import Link from "next/link";

export default function AdminSidebar({ active }: { active: string }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-20 transition-all duration-300 
        ${open ? "w-64" : "w-16"} 
        bg-white shadow-xl flex flex-col`}
    >
      {/* Header with logo */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center space-x-2">
          <img src="/images/img2.png" alt="SwiftCart Logo" className="w-50 h-25" />
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[#4097c0] text-2xl focus:outline-none"
        >
          {open ? "≡" : "☰"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          <li>
            <Link href="/dashboard">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
                ${active === "dashboard" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
              >
                <span className="mr-3">🏠</span>
                {open && "Dashboard"}
              </div>
            </Link>
          </li>
          <li>
            <Link href="/admin/hardware-status">
              <div
                className={`flex items-center px-4 py-2 cursor-pointer hover:bg-blue-50 rounded-lg 
                ${active === "hardware" ? "bg-blue-100 text-blue-900 font-bold" : "text-blue-800"}`}
              >
                <span className="mr-3">💻</span>
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
                <span className="mr-3">⚙️</span>
                {open && "System Configuration"}
              </div>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto px-4 py-3 border-t text-xs text-gray-500">
        {open && (
          <>
            <div className="cursor-pointer hover:text-gray-700">⚙️ Settings</div>
            <div className="cursor-pointer hover:text-gray-700">🚪 Log Out</div>
          </>
        )}
      </div>
    </div>
  );
}
