"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProfileHeader from "./ProfileHeader";

export default function TopNavBar({
  user,
  onSearch,
  onScanBarcode,
  onCreateBill,
}: {
  user: any;
  onSearch?: (query: string) => void;
  onScanBarcode?: () => void;
  onCreateBill?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  // 🔔 FETCH NOTIFICATIONS ON MOUNT
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const res = await fetch(`${apiUrl}/api/product`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const data = await res.json();
        const products = Array.isArray(data)
          ? data
          : data?.data || data?.items || [];

        // Count low stock products
        const lowStockCount = products.filter(
          (p: any) =>
            Number(p.stock) <= Number(p.low_stock_alert_threshold)
        ).length;

        setNotificationCount(lowStockCount);
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };

    fetchNotifications();

    // Optional: Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const hasNotifications = notificationCount > 0;

  return (
    <div
      className="fixed top-2 left-72 w-80/100 z-40 flex items-center px-8 py-3 bg-white rounded-bl-3xl rounded-tl-3xl rounded-br-3xl rounded-tr-3xl border-l-4 border-r-4"
      style={{
        height: 58,
        boxShadow:
          "0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Search Bar */}
      <div className="flex-1 flex items-center mr-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch?.(search);
          }}
          className="w-full max-w-xl relative"
        >
          {/* Search Icon */}
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-700">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M20 20l-3-3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="text"
            className="border border-blue-700 rounded-full pl-10 pr-6 py-2 w-full text-base bg-white text-blue-700 placeholder:text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 transition shadow-lg hover:scale-105 transform"
            placeholder="Search here for product, order......"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      {/* Scan Barcode Button */}
      <div className="ml-15">
        <button
          className="border border-blue-700 px-5 py-2 rounded-full bg-white text-blue-700 font-semibold flex items-center justify-center shadow-lg focus:ring-1 focus:ring-blue-700 transition hover:scale-105 transform"
          onClick={onScanBarcode}
          type="button"
        >
          <span className="mr-2 text-lg flex items-center justify-center">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <rect
                x="6"
                y="6"
                width="1"
                height="12"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="9"
                y="6"
                width="2"
                height="12"
                rx="1"
                fill="currentColor"
              />
              <rect
                x="13"
                y="6"
                width="1"
                height="12"
                rx="0.5"
                fill="currentColor"
              />
              <rect
                x="16"
                y="6"
                width="2"
                height="12"
                rx="1"
                fill="currentColor"
              />
              <path
                d="M2 6a4 4 0 0 1 4-4h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M22 6a4 4 0 0 0-4-4h-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2 18a4 4 0 0 0 4 4h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M22 18a4 4 0 0 1-4 4h-2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Scan Barcode
        </button>
      </div>

      {/* Create Bill Button */}
      <div className="ml-15 mr-3">
        <button
          className="border border-blue-700 px-5 py-2 rounded-full shadow-xl bg-white text-blue-700 font-semibold flex items-center focus:ring-1 focus:ring-blue-700 transition hover:scale-105 transform"
          onClick={onCreateBill}
          type="button"
        >
          <svg
            className="w-6 h-6 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 21v-16a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <line x1="9" y1="15" x2="13" y2="15" />
          </svg>
          Create bill
        </button>
      </div>

      {/* 🔔 NOTIFICATION BELL WITH RED BADGE */}
      <div className="ml-15 mr-23 relative">
        <Link
          href="/notifications"
          className="relative p-2 rounded-full hover:bg-gray-100 transition flex items-center justify-center"
        >
          {/* Bell Icon */}
          <svg
            className={`w-6 h-6 transition-colors ${
              hasNotifications ? "text-red-600 animate-pulse" : "text-blue-700"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 0 1-6 0"
            />
          </svg>

          {/* Red Badge with Count */}
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center">
              <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold px-1 border-2 border-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* Profile Header */}
      <div className="ml-5">
        <ProfileHeader
          name={user?.name}
          role={user?.role}
          profilePhoto={user?.profilePhoto}
        />
      </div>
    </div>
  );
}