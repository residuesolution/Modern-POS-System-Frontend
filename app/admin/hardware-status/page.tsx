"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "../../../components/ProfileHeader";

import {
  fetchHardwareStatus,
  fetchCurrentUser,
} from "../../../services/authService";
import axios from "axios";
import { apiConfig } from "../../../config/apiConfig";

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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | null>(
    null
  );
  const [configForm, setConfigForm] = useState({
    name: "",
    status: "",
    version: "",
    note: "",
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const userData = await fetchCurrentUser();
      const currentUser =
        userData &&
        typeof userData === "object" &&
        "user" in userData &&
        userData.user
          ? userData.user
          : userData &&
            typeof userData === "object" &&
            "data" in userData &&
            userData.data
          ? userData.data
          : {} as User;
      setUser(currentUser);

      if ((currentUser as User)?.role !== "ADMIN") {
        router.replace("/dashboard");
        return;
      }
    }
    getUser();
  }, [router]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = `${apiUrl
      ?.replace(/^http/, "ws")
      .replace(/\/$/, "")}/ws/status`;

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

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Select device from dropdown and open modal
  const handleConfigureClick = () => {
    if (selectedDeviceIndex !== null && devices[selectedDeviceIndex]) {
      const device = devices[selectedDeviceIndex];
      setConfigForm({
        name: device.name,
        status: device.status,
        version: device.version,
        note: device.note,
      });
    } else {
      setConfigForm({ name: "", status: "", version: "", note: "" });
    }
    setShowConfigModal(true);
    setConfigError("");
  };

  // Submit configuration changes
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigError("");
    try {
      if (selectedDeviceIndex === null || !devices[selectedDeviceIndex]) {
        setConfigError("No device selected.");
        setConfigLoading(false);
        return;
      }
      const deviceId = devices[selectedDeviceIndex].id;
      const token = localStorage.getItem("authToken");
      await axios.put(
        `${apiConfig.baseUrl}${apiConfig.endpoints.admin.HARDWARE_STATUS}/update/${deviceId}`,
        configForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowConfigModal(false);
      window.location.reload();
    } catch (err: any) {
      setConfigError(
        err?.response?.data?.message || "Failed to update device."
      );
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
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
      <div className="flex justify-between w-full max-w-4xl mt-25 px-6 items-center">
        <button
          className="bg-blue-100 text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-blue-200"
          onClick={() => window.location.reload()}
        >
          🔄 Rescan
        </button>
        <div className="flex items-center space-x-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={selectedDeviceIndex !== null ? selectedDeviceIndex : ""}
            onChange={(e) => {
              const idx = e.target.value === "" ? null : Number(e.target.value);
              setSelectedDeviceIndex(idx);
            }}
          >
            <option value="">Select Device</option>
            {devices.map((d, i) => (
              <option key={d.id || i} value={i}>
                {d.name || `Device ${i + 1}`}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-100 text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-blue-200"
            onClick={handleConfigureClick}
            disabled={selectedDeviceIndex === null}
          >
            ⚙️ Configure
          </button>
        </div>
      </div>
      {/* Modal for configuration */}
      {showConfigModal && (
        <div className="fixed inset-0 h-screen w-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col justify-center">
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2 text-blue-700">
                Configure Device
              </h3>
            </div>
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={configForm.name}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <input
                  type="text"
                  value={configForm.status}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={configForm.version}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, version: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Note
                </label>
                <input
                  type="text"
                  value={configForm.note}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, note: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                />
              </div>
              {configError && (
                <div className="text-red-700 text-xs">{configError}</div>
              )}
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-blue-900 rounded-lg font-semibold hover:bg-gray-300 transition"
                  onClick={() => setShowConfigModal(false)}
                  disabled={configLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  disabled={configLoading}
                >
                  {configLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
