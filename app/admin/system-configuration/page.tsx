"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "../../../components/ProfileHeader";
import { fetchSystemConfig, fetchCurrentUser } from "../../../services/authService";

type User = {
  name: string;
  role: string;
  profilePhoto?: string;
  [key: string]: any;
};

export default function SystemConfigurationPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    let ws: WebSocket | null = null;
    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws")}/ws/status`;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const userData = await fetchCurrentUser();
        const currentUser =
          (userData && typeof userData === "object" && "user" in userData && userData.user) ||
          (userData && typeof userData === "object" && "data" in userData && userData.data) ||
          userData;
        setUser(currentUser as User);

        // Redirect if not admin
        if ((currentUser as User)?.role !== "ADMIN") {
          router.replace("/dashboard");
          return;
        }

        const data = await fetchSystemConfig();
        setConfig(Array.isArray(data) ? data[0] : data);
      } catch (err: any) {
        setError(err?.message || "Failed to load system configuration.");
      } finally {
        setLoading(false);
      }
    }
    loadData();

    ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "system" && msg.data) {
          setConfig(msg.data);
        }
        if (msg.type === "system_deleted" && msg.id) {
          setConfig(null);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Cleanup WebSocket on unmount
    return () => {
      if (ws) ws.close();
    };
  }, [router]);

  return (
    <div className="w-full flex flex-col items-center">
      {user && (
        <ProfileHeader
          name={user.name}
          role={user.role}
          profilePhoto={user.profilePhoto}
        />
      )}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-2xl mt-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-blue-900">
          SYSTEM HEALTH
        </h2>
        {loading ? (
          <div className="text-blue-700 text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-700 text-center py-8">{error}</div>
        ) : config ? (
          <>
            <div className="mb-4 px-25">
              <div className="flex items-center mb-2">
                <span className="font-bold mr-3 text-blue-800 w-20">CPU:</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-400 h-4 rounded-full"
                    style={{ width: `${config.cpu}%` }}
                  ></div>
                </div>
                <span className="ml-3 text-blue-900 font-semibold">
                  {config.cpu}%
                </span>
              </div>
            </div>
            <div className="mb-4 px-25">
              <div className="flex items-center mb-2">
                <span className="font-bold mr-3 text-blue-800 w-20">MEMORY:</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-400 h-4 rounded-full"
                    style={{ width: `${config.memory}%` }}
                  ></div>
                </div>
                <span className="ml-3 text-blue-900 font-semibold">
                  {config.memory}%
                </span>
              </div>
            </div>
            <div className="mt-15 text-blue-900 px-25">
              <div className="font-bold mb-2 text-blue-800">
                LAST BACKUP:{" "}
                <span className="font-normal text-blue-900">
                  {config.lastBackup}
                </span>
              </div>
              <div className="font-bold text-blue-800">
                UPTIME:{" "}
                <span className="font-normal text-blue-900">{config.uptime}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-700 text-center py-8">No configuration found.</div>
        )}
      </div>
      {config?.warnings && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-30">
          {(Array.isArray(config.warnings)
            ? config.warnings
            : String(config.warnings).split(",")
          ).map((w: string, i: number) => (
            <div
              key={i}
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl flex items-center font-semibold shadow-sm"
            >
              <span className="mr-2">⚠️</span> {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}