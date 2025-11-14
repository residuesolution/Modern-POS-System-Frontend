import axios from "axios";
import { apiConfig } from "../config/apiConfig";
import client from "../utils/appClient";

const API_BASE_URL = apiConfig.baseUrl;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;
console.log("API_BASE_URL:", API_BASE_URL);

interface AuthResponse {
  token: string;
  status: string;
  id?: number;
  [key: string]: any;
}

// --- helper functions (existing exports) ---
export async function emailOrderReceipt(orderId: number, email?: string) {
  const body = email ? { email } : {};
  const res = await client.post(`/api/orders/email/${orderId}`, body);
  return res.data;
}

export async function smsOrderReceipt(orderId: number, phone: string) {
  const res = await client.post(`/api/orders/sms/${orderId}`, { phone });
  return res.data;
}

export async function printOrderReceipt(orderId: number) {
  const res = await client.post(`/api/orders/print/${orderId}`);
  return res.data;
}

export async function holdOrder(orderId: number) {
  const res = await client.post(`/api/orders/hold/${orderId}`);
  return res.data;
}

export async function voidOrder(orderId: number) {
  const res = await client.post(`/api/orders/void/${orderId}`);
  return res.data;
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

// WebAuthn helpers...
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

// Admin / Profile / Help / Product APIs (kept as-is)
export const fetchHardwareStatus = async () => {
  const token = localStorage.getItem("authToken");
  const res = await axios.get(
    `${API_BASE_URL}${apiConfig.endpoints.admin.HARDWARE_STATUS}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const fetchSystemConfig = async () => {
  const token = localStorage.getItem("authToken");
  const res = await axios.get(
    `${API_BASE_URL}${apiConfig.endpoints.admin.SYSTEM_CONFIG}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const fetchCurrentUser = async () => {
  const token = localStorage.getItem("authToken");
  const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateCurrentUser = async (userData: any) => {
  const token = localStorage.getItem("authToken");
  const res = await axios.put(`${API_BASE_URL}/api/auth/me`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const uploadProfilePhoto = async (file: File) => {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post(`${API_BASE_URL}/api/user/me/photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const fetchHelpContent = async () => {
  const res = await axios.get(`${API_BASE_URL}/api/help`);
  return res.data;
};

export const sendHelpFeedback = async ({
  email,
  feedback,
}: {
  email: string;
  feedback: string;
}) => {
  const res = await axios.post(`${API_BASE_URL}/api/help/feedback`, {
    userEmail: email,
    feedback,
  });
  return res.data;
};

// Search, product by barcode, createBill (kept, with binary handling)
export async function searchProducts(query: string) {
  if (!query || !query.trim()) return [];
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${base}/api/product/search?q=${encodeURIComponent(query)}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("[searchProducts] no auth token found in localStorage (authToken)");
  }

  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Search failed (${res.status})`);
  }
  if (!text.trim()) return [];
  try {
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : json?.data || json?.items || [];
  } catch {
    return [];
  }
}

export async function searchOrders(query: string) {
  if (!query || !query.trim()) return [];
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${base}/api/order/search?q=${encodeURIComponent(query)}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("[searchOrders] no auth token found in localStorage (authToken)");
  }

  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Search failed (${res.status})`);
  }
  if (!text.trim()) return [];
  try {
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : json?.data || json?.items || [];
  } catch {
    return [];
  }
}

export async function fetchNotifications() {
  const res = await client.get("/api/notifications");
  return res.data;
}

// export named fetchProductByBarcode (fixed) — matches backend ProductController @RequestMapping("/api/product")
export async function fetchProductByBarcode(barcode: string) {
  if (!barcode) throw new Error("barcode required");
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const url = `${base}/api/product/barcode/${encodeURIComponent(barcode)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 404) {
    return null; // caller can handle null as "not found"
  }
  if (!res.ok) {
    const body = await res.text().catch(() => null);
    throw new Error(body || `HTTP ${res.status}`);
  }
  return await res.json();
}

export async function createBill(data: { order: any; items: any[] }) {
  const res = await client.post("/api/orders/add", data, { responseType: "arraybuffer", timeout: 60000 });
  const contentType = (res.headers && (res.headers["content-type"] || res.headers["Content-Type"]))?.toLowerCase() || "";
  const raw = res.data as ArrayBuffer | Uint8Array;
  const arr = raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(raw);

  if (contentType.includes("application/json")) {
    const text = new TextDecoder("utf-8").decode(arr);
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }

  if (contentType.includes("application/pdf")) {
    const blob = new Blob([arr], { type: "application/pdf" });
    return { pdf_blob: blob };
  }

  const text = new TextDecoder("utf-8").decode(arr);
  if (contentType.includes("text/html") || text.trim().startsWith("<")) {
    return { html: text };
  }

  return { text };
}

// helper to compose headers
const buildHeaders = (extra?: Record<string, string>) => {
  const token = localStorage.getItem("authToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  };
};

// Face / categories etc. (kept)
export async function registerFace(email: string, embedding: number[]) {
  try {
    const res = await axios.post(
      `${API_BASE_URL}${apiConfig.endpoints.auth.FACEID_REGISTER}`,
      { email, embedding },
      {
        headers: buildHeaders({ "Content-Type": "application/json" }),
      }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || "Face registration failed");
  }
}

export async function loginFace(email: string, embedding: number[]) {
  try {
    const res = await axios.post<AuthResponse>(
      `${API_BASE_URL}${apiConfig.endpoints.auth.FACEID_LOGIN}`,
      { email, embedding },
      {
        headers: buildHeaders({ "Content-Type": "application/json" }),
      }
    );
    if (res.data?.token) {
      localStorage.setItem("authToken", res.data.token);
      if (res.data.id) localStorage.setItem("userId", String(res.data.id));
    }
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      throw new Error("Unauthorized: face login rejected by server.");
    }
    throw new Error(err.response?.data?.message || err.message || "Face login failed");
  }
}

export async function getFace(email: string) {
  try {
    const res = await axios.get(
      `${API_BASE_URL}${apiConfig.endpoints.auth.FACEID_GET}${encodeURIComponent(email)}`,
      { headers: buildHeaders() }
    );
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      throw new Error("Unauthorized: missing or invalid token.");
    }
    throw new Error(err.response?.data?.message || err.message || "Failed to get face data");
  }
}

export async function updateFace(email: string, embedding: number[]) {
  try {
    const res = await axios.put(
      `${API_BASE_URL}${apiConfig.endpoints.auth.FACEID_UPDATE}`,
      { email, embedding },
      { headers: buildHeaders({ "Content-Type": "application/json" }) }
    );
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      throw new Error("Unauthorized: missing or invalid token.");
    }
    throw new Error(err.response?.data?.message || err.message || "Failed to update face data");
  }
}

export async function deleteFace(email: string) {
  try {
    const res = await axios.delete(
      `${API_BASE_URL}${apiConfig.endpoints.auth.FACEID_DELETE}${encodeURIComponent(email)}`,
      { headers: buildHeaders() }
    );
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      throw new Error("Unauthorized: missing or invalid token.");
    }
    throw new Error(err.response?.data?.message || err.message || "Failed to delete face data");
  }
}

// categories
export async function fetchCategories() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${base}/api/category`;
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

// ...existing exports...
export async function processPayment(payload: any) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const url = `${base}/api/payments/process`;
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: Record<string,string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = await res.text().catch(()=>null);
    throw new Error(err || `Payment failed ${res.status}`);
  }
  return res.json();
}
export default {
  fetchCurrentUser,
  fetchNotifications,
  fetchProductByBarcode,
  createBill,
  emailOrderReceipt,
  smsOrderReceipt,
  printOrderReceipt,
  holdOrder,
  voidOrder,
  searchProducts,
  searchOrders,
  fetchCategories,
  processPayment, // include named helper in default export for convenience
};