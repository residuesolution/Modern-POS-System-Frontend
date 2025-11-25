"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, updateCurrentUser, uploadProfilePhoto } from "../../services/authService";
import { getProfilePhotoUrl } from "../../utils/imageUtils";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCurrentUser();
        let userData;
        if (typeof data === "object" && data !== null) {
          userData = (data as any).user || (data as any).data || data;
        } else {
          userData = {};
        }
        setUser(userData);
        setForm(userData);
      } catch (err: any) {
        setError(err?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEditMode(false);
    setForm(user);
    setError("");
    setSuccess("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (JSON.stringify(form) === JSON.stringify(user)) {
      return;
    }
    try {
      const res = await updateCurrentUser(form);
      let updatedUser;
      if (typeof res === "object" && res !== null) {
        updatedUser = (res as any).user || (res as any).data || res;
      } else {
        updatedUser = {};
      }
      setUser(updatedUser);
      setForm(updatedUser);
      setEditMode(false);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
      setSuccess("");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const res = await uploadProfilePhoto(e.target.files[0]);
      const photoUrl = (res as any).url;
      setUser((prev: any) => ({ ...prev, profilePhoto: photoUrl }));
      setForm((prev: any) => ({ ...prev, profilePhoto: photoUrl }));
      setSuccess("Profile photo updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to upload photo.");
      setUser((prev: any) => ({ ...prev, profilePhoto: user.profilePhoto }));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Top right back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 right-8 bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-xs shadow hover:bg-blue-700 transition"
        title="Back to Dashboard"
      >
        Back to Dashboard
      </button>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <h2 className="text-xl font-bold mb-6 text-blue-900 text-center">My Profile</h2>
        {loading ? (
          <div className="text-blue-700 text-center py-8">Loading...</div>
        ) : error ? (
          <div className="text-red-700 text-center py-8">{error}</div>
        ) : user ? (
          <>
            <form onSubmit={handleSave} className="space-y-4 text-blue-900">
              <div className="flex flex-col items-center space-y-2 mb-4">
                {form.profilePhoto ? (
                  <img
                    src={getProfilePhotoUrl(form.profilePhoto)}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border mb-2"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-white">
                    {form.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="block text-xs"
                  style={{ width: "auto" }}
                />
                {uploading && <span className="text-xs text-gray-500">Uploading...</span>}
              </div>
              <div>
                <label className="font-semibold block mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={form.name || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={form.email || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Role:</label>
                <input
                  type="text"
                  name="role"
                  value={form.role || ""}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100"
                />
              </div>
              {/* Centered button with margin-top */}
              <div className="flex justify-center mt-8 space-x-3">
                {editMode ? (
                  <>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 text-white rounded-full shadow font-semibold text-sm hover:bg-blue-700 transition-all duration-200 border-2 border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-5 py-2 bg-gray-200 text-gray-700 rounded-full shadow font-semibold text-sm hover:bg-gray-300 transition-all duration-200 border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-5 py-2 bg-blue-100 text-blue-700 rounded-full shadow font-semibold text-sm hover:bg-blue-200 transition-all duration-200 border-2 border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
            {success && !editMode && (
              <div className="text-green-700 text-xs mt-4 text-center">{success}</div>
            )}
          </>
        ) : (
          <div className="text-gray-700 text-center py-8">No profile found.</div>
        )}
      </div>
    </div>
  );
}