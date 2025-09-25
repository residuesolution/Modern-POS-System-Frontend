"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  getWebAuthnLoginOptions,
  verifyWebAuthnLogin,
} from "../../../services/authService";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export default function FaceIDLogin() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Registration flow
  const handleRegister = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const options = await getWebAuthnRegistrationOptions(email);
      const credential = await startRegistration(options);
      const result = await verifyWebAuthnRegistration(email, credential) as { message?: string };
      if (result.message && result.message.toLowerCase().includes("already registered")) {
        setMessage("You have already registered biometric for this account.");
        return;
      }
      setMessage(result.message || "FaceID registered!");
    } catch (err: any) {
      setMessage(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Login flow
  const handleLogin = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const options = await getWebAuthnLoginOptions(email);
      const assertion = await startAuthentication(options);
      const result = await verifyWebAuthnLogin(email, assertion) as { message?: string; token?: string };
      setMessage(result.message || "Login successful!");
      // Store JWT in cookie if returned
      if (result.token) {
        document.cookie = `JWT=${result.token}; path=/; max-age=3600;`;
        localStorage.setItem("authToken", result.token);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setMessage(err?.message || "Login failed");
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
        {/* Right side - Biometric form */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center space-y-4">
          <div className="w-3/4 max-w-sm mx-auto">
            <div className="text-center mb-4">
              <img src="/images/img2.png" alt="SwiftCart Logo" className="w-50 h-25 mx-auto mb-1" />
            </div>
            <div className="text-center mt-2 mb-3 space-y-3">
              <div className="text-black text-lg font-semibold mb-2">Sign In with FaceID</div>
              <p className="text-xs text-gray-600 mb-2">Use your registered FaceID credential to login.</p>
              <Link href="/auth/login">
                <div className="text-blue-600 hover:text-blue-700 cursor-pointer text-xs mb-2 underline">Back to Login</div>
              </Link>
            </div>
            <form className="space-y-3" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="button"
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs mb-2"
                onClick={handleRegister}
                disabled={isLoading || !email}
              >
                {isLoading ? "Registering..." : "Register FaceID"}
              </button>
              <button
                type="button"
                className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-xs"
                onClick={handleLogin}
                disabled={isLoading || !email}
              >
                {isLoading ? "Authenticating..." : "Login with FaceID"}
              </button>
            </form>
            {message && (
              <div className={`mt-4 p-2 ${message.includes("success") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"} rounded-lg text-xs text-center`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}