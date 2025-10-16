"use client";
import { useState, useEffect } from "react";
import FaceIDCamera from "../../../components/FaceIDCamera";
import { registerFace, loginFace, getFace, updateFace, deleteFace } from "../../../services/authService";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FaceIDLogin() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("login");
  const [isRegistered, setIsRegistered] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const router = useRouter();

  // Reset message and camera when mode changes
  const handleModeChange = (newMode: "register" | "login") => {
    setMode(newMode);
    setMessage("");
    setCameraActive(true);
  };

  // Silent check: when email changes, check if face embedding exists (no visible button)
  useEffect(() => {
    let active = true;
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!email || !token) {
      setIsRegistered(false);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        const response = await getFace(email);
        if (!active) return;
        const data = (response as any)?.data;
        if (data?.status === "success" && data.faceEmbedding) {
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
        }
      } catch (err) {
        // ignore errors silently (keeps UI clean)
        setIsRegistered(false);
      }
    }, 400); // debounce

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [email]);

  type RegisterFaceResponse = {
    status?: string;
    message?: string;
  };

  type LoginFaceResponse = {
    token?: string;
    message?: string;
  };

  // Capture handler - register will update silently if already registered
  const handleCapture = async (embedding: number[]) => {
    setIsLoading(true);
    setMessage("");
    try {
      if (!email) {
        setMessage("Please enter your email.");
        setCameraActive(true);
        return;
      }
      const embeddingArray = Array.from(embedding);

      if (mode === "register") {
        if (isRegistered) {
          // silently update stored embedding (no visible button)
          try {
            await updateFace(email, embeddingArray);
            setMessage("Face re-enrolled (updated).");
            setIsRegistered(true);
            setCameraActive(false);
          } catch (e: any) {
            setMessage(e?.response?.data?.message || "Update failed.");
            setCameraActive(true);
          }
          return;
        }

        const res = await registerFace(email, embeddingArray);
        const data = (res as any)?.data as RegisterFaceResponse;
        if (data && data.status === "success") {
          setMessage("Face registered! You can now login.");
          setIsRegistered(true);
          setCameraActive(false);
        } else if (data && data.message && data.message.toLowerCase().includes("already registered")) {
          // In case backend reports already registered, mark as registered and update silently
          setIsRegistered(true);
          try {
            await updateFace(email, embeddingArray);
            setMessage("Face updated after registration conflict.");
            setCameraActive(false);
          } catch {
            setMessage("Face already registered.");
            setCameraActive(false);
          }
        } else if (data && data.message && data.message.toLowerCase().includes("user not found")) {
          setMessage("User not found. Please register with email/password first.");
          setCameraActive(true); // Keep camera active so user can try again
        } else {
          setMessage((data && typeof data.message === "string") ? data.message : "Registration failed.");
          setCameraActive(true); // Keep camera active so user can try again
        }
      } else {
        const res = await loginFace(email, embeddingArray);
        const data = (res as any)?.data as LoginFaceResponse;
        if (data && data.token) {
          localStorage.setItem("authToken", data.token);
          setMessage("Login successful!");
          setCameraActive(false);
          setTimeout(() => router.push("/dashboard"), 1000);
        } else {
          setMessage(data?.message || "Face not recognized.");
          setCameraActive(true); // Allow retry
        }
      }
    } catch (err: any) {
      setMessage(err?.response?.data?.message || "Error occurred.");
      setCameraActive(true); // Allow retry
    } finally {
      setIsLoading(false);
    }
  };

  // Hidden delete function - call programmatically from account deletion flow
  async function handleDeleteFaceForEmail(targetEmail: string) {
    try {
      setIsLoading(true);
      await deleteFace(targetEmail);
      if (targetEmail === email) {
        setIsRegistered(false);
      }
      setMessage("FaceID removed.");
    } catch (e: any) {
      setMessage(e?.response?.data?.message || "Failed to remove FaceID.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full h-[580px]">
        {/* Left side - Image/Branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#5EC6F8] via-[#0097D1] to-[#013D6E] items-center justify-center p-0">
          <img src="/images/img1.jpg" alt="SwiftCart POS" className="w-full h-full object-cover" />
        </div>
        {/* Right side - Biometric form */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center space-y-4">
          <div className="w-3/4 max-w-sm mx-auto mb-20">
            <div className="text-center mt-20">
              <img src="/images/img2.png" alt="SwiftCart Logo" className="w-50 h-25 mx-auto" />
            </div>
            <div className="text-center mt-2 mb-3 space-y-3">
              <div className="text-black text-lg font-semibold mb-2">
                {mode === "register" ? "Register FaceID" : "Sign In with FaceID"}
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Use your registered FaceID credential to {mode === "register" ? "register" : "login"}.
              </p>
              <Link href="/auth/login">
                <div className="text-blue-600 hover:text-blue-700 cursor-pointer text-xs mb-2 underline">
                  Back to Login
                </div>
              </Link>
            </div>
            <form className="space-y-3" onSubmit={e => e.preventDefault()}>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setIsRegistered(false);
                    setMessage("");
                    setCameraActive(true);
                  }}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                  required
                  disabled={isLoading}
                />
              </div>
            </form>
            {/* Camera only active if not disabled */}
            <FaceIDCamera onCapture={handleCapture} isActive={cameraActive} />
            <div className="flex justify-between mt-4 space-x-6">
              {/* Register Button (switches mode only) */}
              <button
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs"
                onClick={() => handleModeChange("register")}
                disabled={isLoading}
              >
                {isLoading && mode === "register" ? "Registering..." : "Register FaceID"}
              </button>
              {/* Login Button (switches mode only) */}
              <button
                className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-xs"
                onClick={() => handleModeChange("login")}
                disabled={isLoading}
              >
                {isLoading && mode === "login" ? "Authenticating..." : "Login FaceID"}
              </button>
            </div>
            {message && (
              <div className="mt-4 text-center text-sm text-blue-700">{message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
