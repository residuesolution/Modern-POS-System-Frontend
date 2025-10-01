"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "../../../services/authService";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // Success message state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (!acceptedTerms) {
        throw new Error("You must accept the Terms and Privacy Policy.");
      }
      await registerUser(username, email, password, role);
      setSuccess("Registration successful! Please login with your credentials.");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (error: any) {
      setError(error.message || "Error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full min-h-[500px] md:h-[650px]">
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#5EC6F8] via-[#0097D1] to-[#013D6E] items-center justify-center p-0">
          <img
            src="/images/img1.jpg"
            alt="SwiftCart POS"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 p-2 md:p-15 flex flex-col justify-center space-y-4">
          <div className="w-full max-w-sm mx-auto space-y-2">
            <div className="text-center mb-1">
              <img
                src="/images/img2.png"
                alt="SwiftCart Logo"
                className="w-50 h-25 mx-auto mt-12 "
              />
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Get On Board!
              </h2>
            </div>
            {/* Success message */}
            {success && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center">
                {success}
              </div>
            )}
            {/* Error message */}
            {error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {error}
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-3">
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
                  Email
                </label>
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {/* Eye icon */}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Select Your Role
                </label>
                <div className="flex space-x-13">
                  <label className="flex items-center text-sm font-semibold text-gray-800">
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={role === "ADMIN"}
                      onChange={() => setRole("ADMIN")}
                      disabled={isLoading}
                      className="mr-2 accent-blue-600"
                    />
                    <span className="text-gray-800">Admin</span>
                  </label>
                  <label className="flex items-center text-sm font-semibold text-gray-800">
                    <input
                      type="radio"
                      name="role"
                      value="MANAGER"
                      checked={role === "MANAGER"}
                      onChange={() => setRole("MANAGER")}
                      disabled={isLoading}
                      className="mr-2 accent-blue-600"
                    />
                    <span className="text-gray-800">Manager</span>
                  </label>
                  <label className="flex items-center text-sm font-semibold text-gray-800">
                    <input
                      type="radio"
                      name="role"
                      value="CASHIER"
                      checked={role === "CASHIER"}
                      onChange={() => setRole("CASHIER")}
                      disabled={isLoading}
                      className="mr-2 accent-blue-600"
                    />
                    <span className="text-gray-800">Cashier</span>
                  </label>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2 py-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-3/4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs block mx-auto"
              >
                {isLoading ? "Registering..." : "Sign Up"}
              </button>
            </form>

            <div className="text-center pt-3 border-t border-gray-200 mb-15">
              <span className="text-gray-600 text-xs">
                Already have an account?{" "}
              </span>
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-medium hover:underline text-xs"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}