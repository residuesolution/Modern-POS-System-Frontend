"use client";
import { useState } from "react";
import { createBill } from "../services/authService";

export default function CreateBill({ onBillCreated }: { onBillCreated?: (bill: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "LOYALTY" | "WALLET">("CASH");

  const handleAddItem = () => {
    if (barcode) {
      setItems(prev => [...prev, { barcode }]);
      setBarcode("");
    }
  };

  const openPdfBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const openHtml = (html: string) => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  const handleCreateBill = async () => {
    if (items.length === 0) {
      setMessage("Add at least one item.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const total = items.reduce((s, it) => s + (Number(it.price ?? 0) * (it.quantity ?? 1)), 0);
      const order = {
        customer_id: 1,
        user_id: Number(localStorage.getItem("userId")) || 1,
        payment_method: paymentMethod,
        total_amount: total || 0,
        discount_amount: 0,
        loyalty_points_used: 0,
        status: "completed"
      };
      const payload = { order, items };
      const res = await createBill(payload);

      // open receipt if backend returned pdf_url / pdf_blob / html / pdf_base64
      if (res?.pdf_url) {
        window.open(res.pdf_url, "_blank");
      } else if (res?.pdf_blob) {
        openPdfBlob(res.pdf_blob);
      } else if (res?.pdf_base64) {
        const byteString = atob(res.pdf_base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        const blob = new Blob([ab], { type: "application/pdf" });
        openPdfBlob(blob);
      } else if (res?.html) {
        openHtml(res.html);
      }

      setMessage("Bill created!");
      setItems([]);
      onBillCreated?.(res);
    } catch (err) {
      console.error("create bill error:", err);
      setMessage("Failed to create bill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-md w-full">
      <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
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

      <div className="mb-2">
        <label className="text-sm block mb-1">Payment method</label>
        <select
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value as any)}
          className="border px-3 py-2 rounded-lg w-full"
        >
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="LOYALTY">Loyalty</option>
          <option value="WALLET">Digital Wallet</option>
        </select>
      </div>

      <ul className="mb-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm flex justify-between items-center">
            <span>{item.barcode || item.productName || `Item ${idx+1}`}</span>
            <span className="text-xs text-gray-500">qty: {item.quantity ?? 1}</span>
          </li>
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