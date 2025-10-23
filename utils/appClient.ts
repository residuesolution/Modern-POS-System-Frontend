import axios from "axios";
import { apiConfig } from "../config/apiConfig";

const API_BASE_URL = apiConfig.baseUrl;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: apiConfig.timeout || 10000,
});

// attach auth header automatically
client.interceptors.request.use((cfg) => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (token) {
      cfg.headers = cfg.headers || {};
      cfg.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (e) { /* ignore in SSR */ }
  return cfg;
}, (err) => Promise.reject(err));

export default client;