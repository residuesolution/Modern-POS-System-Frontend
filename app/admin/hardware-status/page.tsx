"use client";
import { useEffect, useState } from "react";
import ProfileHeader from "../../../components/ProfileHeader";
import { fetchHardwareStatus, fetchCurrentUser } from "../../../services/authService";

export default function HardwareStatusPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  type User = {
    name?: string;
    role?: string;
    profilePhoto?: string;
    [key: string]: any;
  };
  const [user, setUser] = useState<User | null>(null);

  // Fetch user profile separately and update if profile changes
  useEffect(() => {
    async function getUser() {
      const userData = await fetchCurrentUser();
      setUser(
        userData && typeof userData === "object" && "user" in userData && userData.user
          ? (userData.user as User)
          : userData && typeof userData === "object" && "data" in userData && userData.data
          ? (userData.data as User)
          : (userData as User)
      );
    }
    getUser();
    // Optionally, you can add a polling or subscribe to profile changes if needed
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = `${apiUrl?.replace(/^http/, "ws").replace(/\/$/, "")}/ws/status`;

    console.log("Attempting to connect to WebSocket:", wsUrl);

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchHardwareStatus();
        setDevices(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load hardware status.");
      } finally {
        setLoading(false);
      }
    }
    loadData();

    ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "hardware" && msg.data) {
          setDevices((prev) => {
            if (Array.isArray(msg.data)) return msg.data;
            if (msg.data.id) {
              const idx = prev.findIndex((d) => d.id === msg.data.id);
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = msg.data;
                return updated;
              }
              return [...prev, msg.data];
            }
            return prev;
          });
        }
        if (msg.type === "hardware_deleted" && msg.id) {
          setDevices((prev) => prev.filter((d) => d.id !== msg.id));
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
   
  }, []);

  return (
    <div className="relative w-full flex flex-col items-center">
      {user && (
        <ProfileHeader
          name={user.name}
          role={user.role}
          profilePhoto={user.profilePhoto}
        />
      )}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-4xl overflow-x-auto mt-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-blue-900">
          CONNECTED DEVICES
        </h2>
        {loading ? (
          <div className="text-blue-700 text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-700 text-center py-8">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left mb-2 text-blue-900 border-collapse">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="py-2 px-3">Device</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Version</th>
                  <th className="py-2 px-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{d.name}</td>
                    <td className="py-2 px-3 flex items-center">
                      {d.status === "Online" && (
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2" />
                      )}
                      {d.status === "Warning" && (
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2" />
                      )}
                      {d.status === "Offline" && (
                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2" />
                      )}
                      {d.status}
                    </td>
                    <td className="py-2 px-3">{d.version}</td>
                    <td className="py-2 px-3">{d.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="flex justify-between w-full max-w-4xl mt-25 px-6">
        <button
          className="bg-blue-100 text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-blue-200"
          onClick={() => window.location.reload()}
        >
          🔄 Rescan
        </button>
        <button className="bg-blue-100 text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-blue-200">
          ⚙️ Configure
        </button>
      </div>
    </div>
  );
}