"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post<{ message?: string }>(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setSuccessMessage(
        response.data?.message ||
        "If the email exists, instructions will be sent shortly."
      );
      setEmail("");
    } catch (error: any) {
      setError(
        error.response?.data?.message ||
        error.response?.data ||
        "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full h-[550px]">
        {/* Left side - Image/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#5EC6F8] via-[#0097D1] to-[#013D6E] items-center justify-center p-0">
          <img src="/images/img1.jpg" alt="SwiftCart POS" className="w-full h-full object-cover" />
        </div>

        {/* Right side - Forgot Password form */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center space-y-4">
          <div className="w-3/4 max-w-sm mx-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <img src="/images/img2.png" alt="SwiftCart Logo" className="w-50 h-20 mx-auto mb-1" />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs">
                {successMessage}
              </div>
            )}

            {/* Forgot Password form */}
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-3/4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs block mx-auto mb-1"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mb-2 text-xs">
              <span className="text-gray-600">Remember your password? </span>
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}