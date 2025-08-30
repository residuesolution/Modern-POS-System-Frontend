import axios from "axios";
import { apiConfig } from "../config/apiConfig";

const API_BASE_URL = apiConfig.baseUrl;

interface AuthResponse {
  token: string;
  status: string;
  id?: number;
  [key: string]: any;
}

export async function loginUser(username: string, password: string) {
  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: username, password }),
    });

    const data = await res.json();

    // ✅ Fix: throw error if backend returned "error" or non-200 response
    if (!res.ok || data.status === "error") {
      throw new Error(data.message || "Login failed");
    }

    return data; // {status, message, token}
  } catch (err: any) {
    throw new Error(err.message || "Login failed");
  }
}

// --- REGISTER: Prevent duplicate username/email ---
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  role: string
) => {
  try {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}${apiConfig.endpoints.auth.REGISTER}`,
      {
        name: username,
        email,
        password,
        role: role.toUpperCase(),
      }
    );
    if (response.data.token) {
      localStorage.setItem("authToken", response.data.token);
      if (response.data.id) {
        localStorage.setItem("userId", response.data.id.toString());
      }
    }
    return response.data;
  } catch (error: any) {
    // Show backend error (e.g. "Username already registered", "Email already registered")
    throw new Error(
      error.response?.data?.message || "Registration failed. Please try again."
    );
  }
};

export const logoutUser = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("userId");
};

export const forgotPassword = async (email: string) => {
  const response = await axios.post(
    `${API_BASE_URL}${apiConfig.endpoints.auth.FORGOT_PASSWORD}`,
    { email }
  );
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await axios.post(
    `${API_BASE_URL}${apiConfig.endpoints.auth.RESET_PASSWORD}`,
    { token, password }
  );
  return response.data;
};

// --- WebAuthn Biometric Authentication ---

export const getWebAuthnRegistrationOptions = async (email: string) => {
  const response = await axios.post(
    `${API_BASE_URL}${apiConfig.endpoints.auth.WEBAUTHN_REGISTER_OPTIONS}`,
    { email }
  );
  const data = response.data as { options: any };
  return data.options;
};

export const verifyWebAuthnRegistration = async (
  email: string,
  credentialResponse: any
) => {
  const response = await axios.post(
    `${API_BASE_URL}${apiConfig.endpoints.auth.WEBAUTHN_REGISTER_VERIFY}`,
    {
      email,
      credentialResponse,
    }
  );
  return response.data;
};

export const getWebAuthnLoginOptions = async (email: string) => {
  const response = await axios.post(
    `${API_BASE_URL}${apiConfig.endpoints.auth.WEBAUTHN_LOGIN_OPTIONS}`,
    { email }
  );
  const data = response.data as { options: any };
  return data.options;
};

export const verifyWebAuthnLogin = async (
  email: string,
  assertionResponse: any
) => {
  if (
    !assertionResponse ||
    (typeof assertionResponse === "object" &&
      Object.keys(assertionResponse).length === 0)
  ) {
    throw new Error("Invalid biometric assertion response.");
  }
  const response = await axios.post(
    `${API_BASE_URL}${apiConfig.endpoints.auth.WEBAUTHN_LOGIN_VERIFY}`,
    {
      email,
      assertionResponse,
    }
  );
  return response.data;
}; 