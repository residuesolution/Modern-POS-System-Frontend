"use client";
import { useEffect, useState } from "react";
import { fetchCurrentUser, updateCurrentUser } from "../../services/authService";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCurrentUser().then(data => {
      setUser(data);
      setName(data.name || "");
      setEmail(data.email || "");
    });
  }, []);

  const handleSave = async () => {
    try {
      await updateCurrentUser({ name, email });
      setMessage("Settings updated!");
    } catch {
      setMessage("Failed to update settings.");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {user ? (
        <div className="space-y-4">
          <div>
            <label>Name:</label>
            <input className="border p-2 ml-2" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label>Email:</label>
            <input className="border p-2 ml-2" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSave}>Save</button>
          {message && <div className="mt-2 text-green-600">{message}</div>}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}