"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopNavBar from "./TopNavBar";
import { fetchCurrentUser } from "../services/authService";
import { 
  getRecommendations, 
  getPromos, 
  createRecommendRequest,
  createPromoRequest,
  type CartItem,
  type RecommendationItem,
  type PromoDecision
} from "../services/aiService";

export default function AIDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'promos'>('recommendations');
  
  // State for different AI features
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [promoDecisions, setPromoDecisions] = useState<PromoDecision[]>([]);

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

  const testRecommendations = async () => {
    setLoading(true);
    try {
      const cartItems: CartItem[] = [
        { productId: "LAPTOP001", quantity: 1 },
        { productId: "MOUSE001", quantity: 2 }
      ];
      
      const request = createRecommendRequest(cartItems, "user123", "store001", 5);
      const response = await getRecommendations(request);
      setRecommendations(response.recommendations);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const testPromos = async () => {
    setLoading(true);
    try {
      const candidatePromos = [
        { promoId: "SAVE10" },
        { promoId: "BULK20" },
        { promoId: "NEWUSER" }
      ];
      
      const request = createPromoRequest(150.0, candidatePromos, "user123", "store001");
      const response = await getPromos(request);
      setPromoDecisions(response.promos);
    } catch (error) {
      console.error("Failed to get promo decisions:", error);
    } finally {
      setLoading(false);
    }
  };


  const renderRecommendations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Product Recommendations</h3>
        <button
          onClick={testRecommendations}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Recommendations"}
        </button>
      </div>
      
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-blue-900">{rec.productId}</h4>
                  <p className="text-sm text-blue-700">{rec.reason}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {rec.score.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🤖</div>
          <p>Click "Test Recommendations" to see AI-powered product suggestions</p>
        </div>
      )}
    </div>
  );

  const renderPromos = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Promotion Analysis</h3>
        <button
          onClick={testPromos}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Promo Analysis"}
        </button>
      </div>
      
      {promoDecisions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promoDecisions.map((promo) => (
            <div key={promo.promoId} className={`border rounded-lg p-4 ${
              promo.recommended ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{promo.promoId}</h4>
                {promo.recommended && <span className="text-green-600">✓</span>}
              </div>
              <p className="text-sm text-gray-600 mb-2">Uplift Score: {promo.upliftScore.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{promo.rationale}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>Click "Test Promo Analysis" to see AI-powered promotion recommendations</p>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-blue-400 to-blue-700">
      {/* Sidebar with logo */}
      <Sidebar active="ai-dashboard" />

      {/* Top Navigation Bar */}
      <div className="flex-1 flex flex-col" style={{marginLeft: 256}}>
        <TopNavBar user={user} />
        
        {/* Main Content */}
        <main className="flex-1 p-8 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  AI Features Dashboard
                </h1>
                <p className="text-gray-600">
                  Test and explore all AI-powered features of the POS system
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { id: 'recommendations', label: 'Recommendations', icon: '🤖' },
                  { id: 'promos', label: 'Promotions', icon: '🎯' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'recommendations' && renderRecommendations()}
                {activeTab === 'promos' && renderPromos()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}