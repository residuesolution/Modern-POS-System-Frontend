"use client";

import { useState } from "react";
import NotificationBell from "./NotificationBell";
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

  return (
    <div
      className="fixed top-2 left-72 w-80/100 z-40 flex items-center px-8 py-3 bg-white rounded-bl-3xl rounded-tl-3xl rounded-br-3xl rounded-tr-3xl border-l-4 border-r-4"
      style={{
        height: 58,
        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)", // Adding a stronger 3D effect
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
            {/* Modern barcode icon */}
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
              {/* Corners */}
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
            stroke="url(#blue-gradient)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <defs>
              <linearGradient
                id="blue-gradient"
                x1="0"
                y1="0"
                x2="24"
                y2="24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#2563eb" /> {/* blue-700 */}
                <stop offset="1" stopColor="#2563eb" /> {/* cyan-400 */}
              </linearGradient>
            </defs>
            <path d="M5 21v-16a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2z" />
            <line x1="9" y1="7" x2="15" y2="7" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <line x1="9" y1="15" x2="13" y2="15" />
          </svg>
          Create bill
        </button>
      </div>

      {/* Notification Bell */}
      <div className="ml-15 mr-23">
        <NotificationBell />
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
