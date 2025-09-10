"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "../../../services/authService";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Success message state
  const [showPassword, setShowPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const result = await loginUser(username, password);

      if (result.status === "success" && result.token) {
        localStorage.setItem("authToken", result.token);
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        setError(result.message || "Invalid credentials. Please try again.");
      }
    } catch (error: any) {
      setError(
        error?.message ||
          error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full h-[550px]">
        {/* Left side - Image/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#5EC6F8] via-[#0097D1] to-[#013D6E] items-center justify-center p-0">
          <img
            src="/images/img1.jpg"
            alt="SwiftCart POS"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side - Login form */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center space-y-4">
          <div className="w-3/4 max-w-sm mx-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <img
                src="/images/img2.png"
                alt="SwiftCart Logo"
                className="w-50 h-25 mx-auto mb-1"
              />
            </div>

            {/* Sign In Options */}
            <div className="text-center mt-2 mb-3 space-y-3">
              <Link href="/auth/fingerprint">
                <div className="text-black hover:text-black cursor-pointer text-sm mb-5">
                  Sign In with Fingerprint
                </div>
              </Link>
              <Link href="/auth/faceid">
                <div className="text-black hover:text-black cursor-pointer text-sm">
                  Sign In with FaceID
                </div>
              </Link>
              <p className="text-xs text-gray-600 my-3">OR</p>
              <div className="text-black text-sm">Sign In with Credentials</div>
            </div>

            {/* Success message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center">
                {success}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {/* Eye icon */}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-black hover:text-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <br />

              <button
                type="submit"
                disabled={isLoading}
                className="w-3/4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs block mx-auto mb-1"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mb-2 mt-2 text-xs">
              <span className="text-gray-600">Don't have an account? </span>
              <Link
                href="/auth/register"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}