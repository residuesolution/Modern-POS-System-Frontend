import axios from "axios";
import { apiConfig } from "../config/apiConfig";

const API_BASE_URL = apiConfig.baseUrl;

// TypeScript interfaces matching the backend DTOs
export interface CartItem {
  productId: string;
  quantity: number;
}

export interface RecommendContext {
  channel?: string;
  timestamp?: string;
  storeId?: string;
}

export interface RecommendRequest {
  userId?: string;
  storeId?: string;
  cartItems: CartItem[];
  topK?: number;
  context?: RecommendContext;
}

export interface RecommendationItem {
  productId: string;
  score: number;
  reason?: string;
}

export interface RecommendResponse {
  modelId: string;
  modelVersion: string;
  ttlMs: number;
  recommendations: RecommendationItem[];
  fallback: boolean;
}

export interface PromoCandidate {
  promoId: string;
}

export interface PromoRequest {
  userId?: string;
  storeId?: string;
  cartTotal: number;
  candidatePromos: PromoCandidate[];
  context?: RecommendContext;
}

export interface PromoDecision {
  promoId: string;
  upliftScore: number;
  recommended: boolean;
  rationale?: string;
}

export interface PromoResponse {
  modelId: string;
  modelVersion: string;
  promos: PromoDecision[];
}

export interface FraudItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Address {
  country?: string;
  zip?: string;
}

export interface FraudOrder {
  orderId?: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  userId?: string;
  ip?: string;
  deviceId?: string;
  items: FraudItem[];
  billingAddress?: Address;
  shippingAddress?: Address;
}

export interface FraudContext {
  channel?: string;
  storeId?: string;
  timestamp?: string;
}

export interface FraudRequest {
  order: FraudOrder;
  context?: FraudContext;
}

export interface FraudResponse {
  modelId: string;
  modelVersion: string;
  riskScore: number;
  label: string;
  factors: string[];
}

export interface SalesPoint {
  date: string; // ISO date
  unitsSold: number;
}

export interface ReorderRequest {
  storeId?: string;
  productId: string;
  currentStock: number;
  leadTimeDays: number;
  reviewPeriodDays: number;
  safetyStockPct: number;
  salesHistory: SalesPoint[];
}

export interface ReorderResponse {
  modelId: string;
  modelVersion: string;
  productId: string;
  suggestedReorderQty: number;
  forecastUnits: number;
  safetyStockUnits: number;
  rationale: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// AI Service Functions
export const getRecommendations = async (payload: any) => {
  const start = Date.now();
  console.debug("AI request payload:", payload);
  try {
    const response = await axios.post(
      `${API_BASE_URL}${apiConfig.endpoints.ai.RECOMMEND}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        timeout: apiConfig.timeout,
      }
    );
    console.debug("AI response:", response.status, response.data, "took", Date.now() - start, "ms");
    return response.data;
  } catch (error: any) {
    console.error("Error getting recommendations:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config,
      tookMs: Date.now() - start
    });
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to get recommendations"
    );
  }
};
// Repeat same improved logging for other functions
export const getPromos = async (payload: any) => {
  try {
    console.debug("AI promo request:", payload);
    const response = await axios.post(
      `${API_BASE_URL}${apiConfig.endpoints.ai.PROMO}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        timeout: apiConfig.timeout,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error getting promo suggestions:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to get promo suggestions"
    );
  }
};

export const getFraudScore = async (payload: any) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${apiConfig.endpoints.ai.FRAUD_SCORE}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        timeout: apiConfig.timeout,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error getting fraud score:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to get fraud score"
    );
  }
};

export const getReorderSuggestion = async (payload: any) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}${apiConfig.endpoints.ai.REORDER_SUGGESTIONS}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        timeout: apiConfig.timeout,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error getting reorder suggestion:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Failed to get reorder suggestion"
    );
  }
};
// Utility functions for common use cases
export const createRecommendRequest = (
  cartItems: CartItem[],
  userId?: string,
  storeId?: string,
  topK: number = 10
): RecommendRequest => ({
  userId,
  storeId,
  cartItems,
  topK,
  context: {
    channel: "pos",
    timestamp: new Date().toISOString(),
    storeId,
  },
});

export const createPromoRequest = (
  cartTotal: number,
  candidatePromos: PromoCandidate[],
  userId?: string,
  storeId?: string
): PromoRequest => ({
  userId,
  storeId,
  cartTotal,
  candidatePromos,
  context: {
    channel: "pos",
    timestamp: new Date().toISOString(),
    storeId,
  },
});

export const createFraudRequest = (
  order: FraudOrder,
  storeId?: string
): FraudRequest => ({
  order,
  context: {
    channel: "pos",
    timestamp: new Date().toISOString(),
    storeId,
  },
});

export const createReorderRequest = (
  productId: string,
  currentStock: number,
  salesHistory: SalesPoint[],
  leadTimeDays: number = 7,
  reviewPeriodDays: number = 30,
  safetyStockPct: number = 0.2,
  storeId?: string
): ReorderRequest => ({
  storeId,
  productId,
  currentStock,
  leadTimeDays,
  reviewPeriodDays,
  safetyStockPct,
  salesHistory,
});