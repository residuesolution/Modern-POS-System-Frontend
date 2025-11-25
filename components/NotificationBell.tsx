"use client";
import { useEffect, useState } from "react";
import { fetchNotifications } from "../services/authService";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setNotifications([]);
      return;
    }
    fetchNotifications()
      .then((data) => setNotifications(data as any[]))
      .catch((err) => {
        if (err?.response?.status === 401) {
          router.push("/auth/login");
        }
        setNotifications([]);
      });
  }, [router]);

  const handleBellClick = () => {
    router.push("/notifications");
  };

  return (
    <div className="relative">
      <button
        className="bg-white rounded-full p-2 shadow-lg border border-blue-700 focus:ring-1 focus:ring-blue-700 transition hover:scale-105 transform"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        {/* Bell icon with blue border, not filled */}
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
          <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"
            stroke="#1D4ED8" strokeWidth="2" fill="none"/>
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs px-1">
            {notifications.length}
          </span>
        )}
      </button>
    </div>
  );
}