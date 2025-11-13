"use client";
import { useState } from "react";
import { createBill, fetchProductByBarcode } from "../services/authService";

export default function CreateBill({ onBillCreated }: { onBillCreated?: (bill: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "LOYALTY" | "WALLET">("CASH");

  const handleAddItem = async () => {
    if (!barcode?.trim()) return;
    setLoading(true);
    setMessage("");

    try {
      const product: any = await fetchProductByBarcode(barcode.trim());
      if (!product || !product.id) {
        setMessage("Product not found");
        setBarcode("");
        return;
      }

      const unitPrice = Number(product.price ?? product.unit_price ?? 0);
      const newItem = {
        product_id: product.id,
        barcode: barcode.trim(),
        productName: product.name ?? product.title ?? null,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice * 1,
      };

      setItems(prev => [...prev, newItem]);
      setBarcode("");
    } catch (err) {
      console.error("fetch product error", err);
      setMessage("Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems(prev => {
      const copy = [...prev];
      const it = copy[index];
      it.quantity = Math.max(0, Math.floor(qty || 0));
      it.total_price = Number(it.unit_price || 0) * Number(it.quantity || 0);
      return copy;
    });
  };

  const handleRemove = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
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

  // Create order on backend, save created order + items to sessionStorage and redirect to payment page
  const handleCreateBill = async () => {
    if (items.length === 0) {
      setMessage("Add at least one item.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const total = items.reduce((s, it) => s + Number(it.total_price ?? 0), 0);
      const order = {
        customer_id: Number(1),
        user_id: Number(localStorage.getItem("userId")) || 1,
        payment_method: paymentMethod,
        total_amount: Number(total) || 0,
        discount_amount: 0,
        loyalty_points_used: 0,
        status: "completed"
      };

      const payload = {
        order,
        items: items.map(it => ({
          product_id: Number(it.product_id),
          barcode: it.barcode,
          product_name: it.productName,
          quantity: Number(it.quantity || 0),
          unit_price: Number(it.unit_price || 0),
          total_price: Number(it.total_price || 0),
        })),
      };

      // create order (backend may return json or pdf/blob); keep current behavior
      const res = await createBill(payload);

      // Notify other tabs/pages
      try { localStorage.setItem("order-created", String(Date.now())); } catch (e) { /* ignore */ }

      // handle PDF / HTML responses if backend returned them
      if (res && res.pdf_blob instanceof Blob) {
        openPdfBlob(res.pdf_blob);
      } else if (res && res.html) {
        openHtml(res.html);
      } else if (res && res.pdf_url) {
        window.open(res.pdf_url, "_blank");
      }

      setMessage("Bill created!");
      setItems([]);

      // Save created order / items / meta to sessionStorage and redirect to payment page.
      try {
        // Normalize created order id and order object from different backends
        const createdOrder = res?.data ?? res ?? {};
        sessionStorage.setItem("checkout_order", JSON.stringify(createdOrder));
        sessionStorage.setItem("checkout_items", JSON.stringify(payload.items));
        sessionStorage.setItem("checkout_meta", JSON.stringify({ paymentMethod, total }));
      } catch (e) {
        console.error("sessionStorage save failed", e);
      }

      // redirect to payment page for selected method
      if (typeof window !== "undefined") {
        window.location.href = `/payments/${paymentMethod.toLowerCase()}`;
      }

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
        <button onClick={handleAddItem} className="bg-blue-600 text-white px-3 py-2 rounded-lg" disabled={loading}>
          {loading ? "Adding..." : "Add"}
        </button>
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

      <ul className="mb-2 divide-y">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm py-2 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.productName ?? item.barcode ?? `Item ${idx+1}`}</div>
              <div className="text-xs text-gray-500">Unit: Rs. {Number(item.unit_price || 0).toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={item.quantity ?? 1}
                onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                className="w-16 border rounded px-2 py-1 text-sm"
              />
              <div className="text-sm">Rs. {(Number(item.total_price) || 0).toFixed(2)}</div>
              <button onClick={() => handleRemove(idx)} className="text-red-500 text-xs ml-2">Remove</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mb-2 text-right font-semibold">
        Total: Rs. {items.reduce((s, it) => s + Number(it.total_price || 0), 0).toFixed(2)}
      </div>

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