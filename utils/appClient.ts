import axios from "axios";
import { apiConfig } from "../config/apiConfig";

const API_BASE_URL = apiConfig.baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: apiConfig.timeout || 10000,
});

// Attach token automatically
client.interceptors.request.use((cfg) => {
  try {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        cfg.headers = cfg.headers || {};
        cfg.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (e) { /* ignore for SSR */ }
  return cfg;
}, (err) => Promise.reject(err));

export default client;