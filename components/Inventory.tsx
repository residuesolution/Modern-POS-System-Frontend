"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavBar from "./TopNavBar";
import { fetchCurrentUser } from "../services/authService";
import { 
  getReorderSuggestion, 
  createReorderRequest,
  type ReorderResponse,
  type SalesPoint 
} from "../services/aiService";

export default function InventoryPage() {
  const [user, setUser] = useState<any>(null);
  
  // AI Reorder Suggestion State (hidden from UI)
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUser() {
      try {
        const userData = await fetchCurrentUser();
        setUser(
          userData && typeof userData === "object" && "user" in userData && userData.user
            ? userData.user
            : userData && typeof userData === "object" && "data" in userData && userData.data
            ? userData.data
            : userData
        );
      } catch {
        setUser(null);
      }
    }
    getUser();
  }, []);

  // AI Reorder Suggestion Functions (available for use but not displayed in UI)
  const getReorderSuggestionForProduct = async (
    productId: string, 
    currentStock: number, 
    salesHistory: SalesPoint[],
    leadTimeDays: number = 7,
    reviewPeriodDays: number = 30,
    safetyStockPct: number = 0.2
  ): Promise<ReorderResponse | null> => {
    setLoading(true);
    try {
      const request = createReorderRequest(
        productId,
        currentStock,
        salesHistory,
        leadTimeDays,
        reviewPeriodDays,
        safetyStockPct,
        "store001"
      );

      const response = await getReorderSuggestion(request);
      setReorderSuggestions(prev => {
        const filtered = prev.filter(s => s.productId !== productId);
        return [...filtered, response];
      });
      return response;
    } catch (error) {
      console.error("Failed to get reorder suggestion:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReorderSuggestionForMultiple = async (
    products: Array<{
      productId: string;
      currentStock: number;
      salesHistory: SalesPoint[];
      leadTimeDays?: number;
      reviewPeriodDays?: number;
      safetyStockPct?: number;
    }>
  ): Promise<ReorderResponse[]> => {
    setLoading(true);
    const suggestions: ReorderResponse[] = [];
    
    for (const product of products) {
      try {
        const request = createReorderRequest(
          product.productId,
          product.currentStock,
          product.salesHistory,
          product.leadTimeDays || 7,
          product.reviewPeriodDays || 30,
          product.safetyStockPct || 0.2,
          "store001"
        );

        const response = await getReorderSuggestion(request);
        suggestions.push(response);
      } catch (error) {
        console.error(`Failed to get reorder suggestion for ${product.productId}:`, error);
      }
    }
    
    setReorderSuggestions(suggestions);
    setLoading(false);
    return suggestions;
  };

  const clearReorderSuggestions = () => {
    setReorderSuggestions([]);
  };

  const getReorderSuggestions = () => {
    return reorderSuggestions;
  };

  const isAnalyzing = () => {
    return loading;
  };

  // Example usage function (you can call this from anywhere)
  const analyzeProductExample = async () => {
    const exampleSalesHistory: SalesPoint[] = [
      { date: "2024-01-01", unitsSold: 5 },
      { date: "2024-01-02", unitsSold: 3 },
      { date: "2024-01-03", unitsSold: 7 },
    ];
    
    const result = await getReorderSuggestionForProduct("PROD001", 10, exampleSalesHistory);
    console.log("AI Reorder Suggestion:", result);
    return result;
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-blue-400 to-blue-700">
          {/* Sidebar with logo */}
          <Sidebar active="inventory" />
    
          {/* Top Navigation Bar */}
          <div className="flex-1 flex flex-col" style={{marginLeft: 256}}>
            <TopNavBar user={user} />
            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 mt-16">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Your Inventory!
                </h1>
                <p className="text-gray-700 mb-6">
                  This is a sample inventory page. You can customize it with your own content and features.
                </p>
                
                {/* AI Reorder Analysis Button */}
                <div className="mb-6">
                  <button
                    onClick={analyzeProductExample}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? "🔄 Analyzing..." : "🤖 Get AI Reorder Analysis"}
                  </button>
                </div>

                {/* AI Reorder Suggestions List */}
                {reorderSuggestions.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-left">
                    <h2 className="text-lg font-semibold text-orange-800 mb-4 text-center">
                      AI Reorder Suggestions
                    </h2>
                    <div className="space-y-4">
                      {reorderSuggestions.map((suggestion) => (
                        <div key={suggestion.productId} className="bg-white border border-orange-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-orange-800">
                              Product: {suggestion.productId}
                            </h3>
                            <span className="text-sm text-gray-500">
                              Model: {suggestion.modelVersion}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {suggestion.suggestedReorderQty}
                              </div>
                              <div className="text-sm text-gray-600">Suggested Reorder</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {suggestion.forecastUnits.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-600">Forecast Demand</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-600">
                                {suggestion.safetyStockUnits.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-600">Safety Stock</div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded p-3">
                            <p className="text-sm text-gray-600">
                              <strong>Rationale:</strong> {suggestion.rationale}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Clear Button */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={clearReorderSuggestions}
                        className="text-red-600 hover:text-red-800 text-sm underline"
                      >
                        Clear All Suggestions
                      </button>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {reorderSuggestions.length === 0 && !loading && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-600">
                      Click the button above to get AI-powered reorder suggestions for your inventory.
                    </p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
  );
}