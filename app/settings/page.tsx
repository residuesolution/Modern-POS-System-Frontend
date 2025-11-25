"use client";

import Link from "next/link";

export default function SettingsPage() {
  // You can add more settings links as needed below
  const settingsLinks = [
    { label: "Profile", href: "/profile" },
    { label: "Notifications", href: "/settings/notifications" },
    { label: "Language & Region", href: "/settings/language" },
    { label: "Security", href: "/settings/security" },

    // Add more as needed
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">
          Settings
        </h1>
        <ul className="space-y-4">
          {settingsLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition text-blue-800 font-medium text-base shadow-sm"
              >
                <span>{item.label}</span>
                <span className="text-blue-400 text-lg">&rarr;</span>
              </Link>
            </li>
          ))}
        </ul>
      
      <div className="text-center mt-6">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:underline text-xs"
        >
          &larr; Back to Dashboard
        </Link>
        </div>
      </div>
    </div>
  );
}
