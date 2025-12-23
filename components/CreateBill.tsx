"use client";
import { useState } from "react";
import { createBill, fetchProductByBarcode } from "../services/authService";
import { useRouter } from "next/navigation";

export default function CreateBill({ onBillCreated }: { onBillCreated?: (bill: any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "LOYALTY" | "WALLET">("CASH");
  const router = useRouter();

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

  const handleCreateBill = async () => {
    if (items.length === 0) { setMessage("Add items"); return; }

    // If user selected CARD -> prepare session and redirect to card payment page
    if (paymentMethod === "CARD") {
      try {
        // Normalize cart for payment page: Payment page expects items like { product: {id, price, name}, qty }
        const normalizedCart = items.map(it => ({
          product: { id: it.product_id, price: it.unit_price, name: it.productName ?? it.barcode },
          qty: it.quantity ?? 1,
        }));

        const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        const user = userJson ? JSON.parse(userJson) : null;
        const meta = { user: user ?? null };

        sessionStorage.setItem("checkout_cart", JSON.stringify(normalizedCart));
        sessionStorage.setItem("checkout_meta", JSON.stringify(meta));

        // Redirect to card payment route which reads sessionStorage
        router.push("/payments/card");
        return;
      } catch (err: any) {
        console.error("prepare checkout failed", err);
        setMessage("Failed to start card checkout");
        return;
      }
    }

    // Non-card: create bill / process payment directly
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") || localStorage.getItem("token") : null;
      const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = userJson ? JSON.parse(userJson) : null;
      const payload = {
        paymentMethod: paymentMethod.toLowerCase(),
        amount: items.reduce((s, it) => s + Number(it.total_price || 0), 0),
        cart: items.map(it => ({ product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price })),
        metadata: { note: "POS bill" },
        userId: user?.id ?? null
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/payments/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create bill");

      onBillCreated?.(json);
      // clear local UI cart
      setItems([]);
      // notify other parts
      try { localStorage.setItem("order-created", Date.now().toString()); } catch {}
      router.push("/payments");
    } catch (err: any) {
      console.error("create bill error", err);
      setMessage(err?.message || "Failed to create bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg max-w-md w-full">
      <h2 className="font-bold text-lg mb-2">Create Bill</h2>

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