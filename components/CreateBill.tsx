"use client";
import { useState, useEffect } from "react";
import { createBill } from "../services/authService";
import { 
  getRecommendations, 
  getPromos, 
  getFraudScore,
  createRecommendRequest,
  createPromoRequest,
  createFraudRequest,
  type CartItem,
  type RecommendationItem,
  type PromoDecision,
  type FraudResponse
} from "../services/aiService";

export default function CreateBill({ onBillCreated }: { onBillCreated?: (bill: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // AI-related state
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [promoDecisions, setPromoDecisions] = useState<PromoDecision[]>([]);
  const [fraudScore, setFraudScore] = useState<FraudResponse | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedPromos, setSelectedPromos] = useState<string[]>([]);

  const handleAddItem = () => {
    if (barcode) {
      const newItem = { 
        barcode, 
        productId: barcode, // Using barcode as productId for simplicity
        quantity: 1,
        price: Math.random() * 50 + 10 // Mock price
      };
      setItems([...items, newItem]);
      setBarcode("");
      setCartTotal(prev => prev + newItem.price);
    }
  };

  // Load AI recommendations when cart changes
  useEffect(() => {
    if (items.length > 0) {
      loadRecommendations();
      loadPromoDecisions();
    } else {
      setRecommendations([]);
      setPromoDecisions([]);
    }
  }, [items, cartTotal]);

  const loadRecommendations = async () => {
    try {
      const cartItems: CartItem[] = items.map(item => ({
        productId: item.productId || item.barcode,
        quantity: item.quantity || 1
      }));
      
      const request = createRecommendRequest(cartItems, "user123", "store001", 5);
      const response = await getRecommendations(request);
      setRecommendations(response.recommendations);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  };

  const loadPromoDecisions = async () => {
    try {
      const candidatePromos = [
        { promoId: "SAVE10" },
        { promoId: "BULK20" },
        { promoId: "NEWUSER" }
      ];
      
      const request = createPromoRequest(cartTotal, candidatePromos, "user123", "store001");
      const response = await getPromos(request);
      setPromoDecisions(response.promos);
    } catch (error) {
      console.error("Failed to load promo decisions:", error);
    }
  };

  const addRecommendation = (recommendation: RecommendationItem) => {
    const newItem = {
      barcode: recommendation.productId,
      productId: recommendation.productId,
      quantity: 1,
      price: Math.random() * 50 + 10 // Mock price
    };
    setItems([...items, newItem]);
    setCartTotal(prev => prev + newItem.price);
  };

  const togglePromo = (promoId: string) => {
    setSelectedPromos(prev => 
      prev.includes(promoId) 
        ? prev.filter(id => id !== promoId)
        : [...prev, promoId]
    );
  };
/*
  const handleCreateBill = async () => {
    setLoading(true);
    setMessage("");
    try {
      const bill = await createBill(items);
      setMessage("Bill created!");
      setItems([]);
      onBillCreated?.(bill);
    } catch {
      setMessage("Failed to create bill.");
    } finally {
      setLoading(false);
    }
  };
*/
const handleCreateBill = async () => {
  setLoading(true);
  setMessage("");
  try {
    // Check fraud score before creating bill
    const fraudRequest = createFraudRequest({
      orderId: `ORDER_${Date.now()}`,
      amount: cartTotal,
      currency: "USD",
      paymentMethod: "CASH",
      userId: "user123",
      items: items.map(item => ({
        productId: item.productId || item.barcode,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0
      })),
      billingAddress: { country: "US", zip: "12345" },
      shippingAddress: { country: "US", zip: "12345" }
    }, "store001");

    const fraudResponse = await getFraudScore(fraudRequest);
    setFraudScore(fraudResponse);

    // If high fraud risk, show warning but allow override
    if (fraudResponse.label === "high") {
      const proceed = window.confirm(
        `High fraud risk detected (${fraudResponse.riskScore.toFixed(2)}). ` +
        `Risk factors: ${fraudResponse.factors.join(", ")}. ` +
        "Do you want to proceed anyway?"
      );
      if (!proceed) {
        setMessage("Transaction cancelled due to fraud risk.");
        setLoading(false);
        return;
      }
    }

    // Create the order
    const order = {
      customer_id: 1,
      user_id: 1,
      payment_method: "CASH",
      total_amount: cartTotal,
      discount_amount: 0,
      loyalty_points_used: 0,
      status: "completed",
      fraud_score: fraudResponse.riskScore,
      fraud_label: fraudResponse.label,
      selected_promos: selectedPromos
    };
    
    const bill = await createBill({ order, items });
    setMessage("Bill created successfully!");
    setItems([]);
    setCartTotal(0);
    setSelectedPromos([]);
    setFraudScore(null);
    onBillCreated?.(bill);
  } catch (error: any) {
    setMessage(`Failed to create bill: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-4xl w-full">
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="text-blue-700">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        Create Bill with AI Features
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Cart and Input */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Enter or scan barcode"
              className="border px-3 py-2 rounded-lg flex-1"
            />
            <button onClick={handleAddItem} className="bg-blue-600 text-white px-3 py-2 rounded-lg">
              Add
            </button>
          </div>

          {/* Cart Items */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-semibold mb-2">Cart Items ({items.length})</h3>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                  <span>{item.barcode}</span>
                  <span className="font-medium">${(item.price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Promo Codes */}
          {promoDecisions.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Available Promotions</h3>
              <div className="space-y-2">
                {promoDecisions.map((promo) => (
                  <label key={promo.promoId} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPromos.includes(promo.promoId)}
                      onChange={() => togglePromo(promo.promoId)}
                      className="rounded"
                    />
                    <span className={promo.recommended ? "text-green-600 font-medium" : "text-gray-600"}>
                      {promo.promoId} {promo.recommended ? "✓ Recommended" : ""}
                    </span>
                    <span className="text-xs text-gray-500">({promo.rationale})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Fraud Detection Status */}
          {fraudScore && (
            <div className={`p-3 rounded-lg ${
              fraudScore.label === "high" ? "bg-red-50 border border-red-200" :
              fraudScore.label === "medium" ? "bg-yellow-50 border border-yellow-200" :
              "bg-green-50 border border-green-200"
            }`}>
              <h3 className="font-semibold mb-1">Fraud Risk Assessment</h3>
              <p className="text-sm">
                Risk Level: <span className={`font-medium ${
                  fraudScore.label === "high" ? "text-red-600" :
                  fraudScore.label === "medium" ? "text-yellow-600" :
                  "text-green-600"
                }`}>{fraudScore.label.toUpperCase()}</span>
              </p>
              <p className="text-xs text-gray-600">
                Score: {fraudScore.riskScore.toFixed(3)} | 
                Factors: {fraudScore.factors.join(", ")}
              </p>
            </div>
          )}

          <button
            onClick={handleCreateBill}
            className="bg-green-600 text-white px-4 py-2 rounded-lg w-full"
            disabled={loading || items.length === 0}
          >
            {loading ? "Creating..." : "Create Bill"}
          </button>
          {message && (
            <div className={`text-sm p-2 rounded ${
              message.includes("successfully") ? "text-green-700 bg-green-50" : 
              message.includes("cancelled") ? "text-red-700 bg-red-50" :
              "text-blue-700 bg-blue-50"
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Right Column - AI Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI Recommendations</h3>
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="text-blue-600 text-sm hover:underline"
            >
              {showRecommendations ? "Hide" : "Show"} Recommendations
            </button>
          </div>

          {showRecommendations && recommendations.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                Based on your cart, we recommend these products:
              </p>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                    <div>
                      <span className="font-medium">{rec.productId}</span>
                      <span className="text-gray-500 ml-2">({rec.reason})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        Score: {rec.score.toFixed(2)}
                      </span>
                      <button
                        onClick={() => addRecommendation(rec)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showRecommendations && recommendations.length === 0 && (
            <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500 text-sm">
              Add items to your cart to see AI recommendations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}