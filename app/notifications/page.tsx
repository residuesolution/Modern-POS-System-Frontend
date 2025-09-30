"use client";
import { useEffect, useState } from "react";
import { fetchNotifications } from "../../services/authService";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchNotifications()
      .then((data) => setNotifications(data as any[]))
      .catch((err) => {
        if (err?.response?.status === 401) {
          router.push("/auth/login");
        }
        setNotifications([]);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">Notifications</h1>
        {loading ? (
          <div className="text-center text-blue-700">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-500">No notifications found.</div>
        ) : (
          <ul className="mb-8">
            {notifications.map((n, idx) => (
              <li
                key={n.id || idx}
                className={`mb-6 p-4 rounded-lg border ${n.read ? "bg-gray-100" : "bg-blue-50 border-blue-200"}`}
              >
                <div className="font-medium text-blue-800">{n.message}</div>
                <div className="text-xs text-gray-500">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                </div>
                {!n.read && (
                  <button
                    className="mt-2 text-xs text-blue-600 underline"
                    onClick={async () => {
                      await fetch(`/api/notifications/mark-read/${n.id}`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
                        },
                      });
                      setNotifications((prev) =>
                        prev.map((notif) =>
                          notif.id === n.id ? { ...notif, read: true } : notif
                        )
                      );
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
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