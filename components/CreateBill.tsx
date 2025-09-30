"use client";
import { useState } from "react";
import { createBill } from "../services/authService";

export default function CreateBill({ onBillCreated }: { onBillCreated?: (bill: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddItem = () => {
    if (barcode) {
      setItems([...items, { barcode }]);
      setBarcode("");
    }
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
    // Example: You may want to collect more order info from the user
    const order = {
      customer_id: 1, // Replace with actual customer/user info
      user_id: 1,
      payment_method: "CASH",
      total_amount: 100, // Calculate total
      discount_amount: 0,
      loyalty_points_used: 0,
      status: "completed"
    };
    const bill = await createBill({ order, items });
    setMessage("Bill created!");
    setItems([]);
    onBillCreated?.(bill);
  } catch {
    setMessage("Failed to create bill.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-md w-full">
      <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
        {/* Modern create bill icon */}
        <span className="text-blue-700">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </span>
        Create Bill
      </h2>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          placeholder="Enter or scan barcode"
          className="border px-3 py-2 rounded-lg flex-1"
        />
        <button onClick={handleAddItem} className="bg-blue-600 text-white px-3 py-2 rounded-lg">Add</button>
      </div>
      <ul className="mb-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm">{item.barcode}</li>
        ))}
      </ul>
      <button
        onClick={handleCreateBill}
        className="bg-green-600 text-white px-4 py-2 rounded-lg w-full"
        disabled={loading || items.length === 0}
      >
        {loading ? "Creating..." : "Create Bill"}
      </button>
      {message && <div className="mt-2 text-xs text-blue-700">{message}</div>}
    </div>
  );
}