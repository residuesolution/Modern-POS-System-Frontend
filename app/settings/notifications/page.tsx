"use client";
import { useEffect, useState } from "react";
import { fetchCurrentUser, updateCurrentUser } from "../../../services/authService";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationSettingsPage() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => {
        setEnabled(!!user.notificationsEnabled);
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateCurrentUser({ notificationsEnabled: enabled });
      setMessage("Notification preference updated!");
    } catch {
      setMessage("Failed to update preference.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6 text-center">Notification Settings</h1>
        {loading ? (
          <div className="text-center text-blue-700">Loading...</div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-blue-900 font-medium">Enable Notifications</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {message && (
              <div className="text-center text-green-600 mt-2">{message}</div>
            )}
          </form>
        )}
        <div className="text-center mt-6">
          <Link href="/settings" className="text-blue-600 hover:underline text-xs">
            &larr; Back to Settings
          </Link>
        </div>
      </div>
    </div>
  );
}