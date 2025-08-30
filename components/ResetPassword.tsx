"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "../services/authService";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await resetPassword(token, password);
      setSuccessMessage("Password reset successful. You can now log in.");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (error: any) {
      if (typeof error.response?.data === "object" && error.response?.data !== null) {
        setError(error.response?.data.message || "Reset password link has expired. Please request a new reset link.");
      } else {
        setError(error.response?.data || "Failed to reset password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Reset Password</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">{error}</div>}
        {successMessage && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs">{successMessage}</div>}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-1/2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs"
            >
              {isLoading ? "Resetting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}