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
    const res = await fetch(`${API_BASE_URL}${apiConfig.endpoints.auth.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: username, password }),
    });

    const data = await res.json();

    if (!res.ok || data.status === "error") {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (err: any) {
    throw new Error(err.message || "Login failed");
  }
}

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
  return (response.data as { options: any }).options;
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
  return (response.data as { options: any }).options;
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

// --- Admin APIs for Hardware Status & System Configuration ---
export const fetchHardwareStatus = async () => {
  const token = localStorage.getItem("authToken");
  const res = await axios.get(
    `${API_BASE_URL}${apiConfig.endpoints.admin.HARDWARE_STATUS}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};

export const fetchSystemConfig = async () => {
  const token = localStorage.getItem("authToken");
  const res = await axios.get(
    `${API_BASE_URL}${apiConfig.endpoints.admin.SYSTEM_CONFIG}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};

// --- Profile APIs ---
export const fetchCurrentUser = async () => {
  const token = localStorage.getItem("authToken");
  const res = await axios.get(
    `${API_BASE_URL}/api/auth/me`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};

export const updateCurrentUser = async (userData: any) => {
  const token = localStorage.getItem("authToken");
  const res = await axios.put(
    `${API_BASE_URL}/api/auth/me`,
    userData,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};

export const uploadProfilePhoto = async (file: File) => {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(
    `${API_BASE_URL}/api/user/me/photo`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    }
  );
  return res.data;
};

export const fetchHelpContent = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/help`);
  return res.data;
};

export const sendHelpFeedback = async ({ email, feedback }: { email: string; feedback: string }) => {
  const res = await axios.post(
    `${API_BASE_URL}/api/help/feedback`,
    { userEmail: email, feedback }
  );
  return res.data;
};

// --- Product Search ---
export async function searchProducts(query: string) {
  const res = await axios.get(`${API_BASE_URL}/api/products/search`, { params: { q: query } });
  return res.data;
}

// --- Order Search ---
export async function searchOrders(query: string) {
  const res = await axios.get(`${API_BASE_URL}/api/orders/search`, { params: { q: query } });
  return res.data;
}

// --- Notifications ---
export async function fetchNotifications() {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Not authenticated");
  const res = await axios.get(
    `${API_BASE_URL}/api/notifications`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function fetchProductByBarcode(barcode: string) {
  const res = await axios.get(`${API_BASE_URL}/api/product/barcode/${barcode}`);
  return res.data;
}

export async function createBill(data: { order: any, items: any[] }) {
  const token = localStorage.getItem("authToken");
  const res = await axios.post(
    `${API_BASE_URL}/api/orders/add`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}