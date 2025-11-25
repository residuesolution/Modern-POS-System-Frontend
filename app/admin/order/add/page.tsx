'use client';
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function SupplierOrderAddPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState<number | "">("");
  const [supplierName, setSupplierName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(`${API_BASE}/api/product`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const body = await res.json();
        const list = Array.isArray(body) ? body : body?.data ?? body?.items ?? [];
        setProducts(list);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!productId || !supplierName || !expectedDate || quantity <= 0) {
      setError("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      // Send expectedDelivery as yyyy-MM-dd (value from <input type="date">)
      // and nested itemOrdered object that matches backend DTO
      const payload = {
        supplierName,
        expectedDelivery: expectedDate,
        itemOrdered: {
          productId: Number(productId),
          quantity,
          productName: products.find(p => Number(p.id) === Number(productId))?.name ?? ""
        }
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/api/supplier-order/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to create supplier order: ${res.status} ${txt}`);
      }
      router.push("/admin/order/view");
    } catch (err: any) {
      setError(err?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Create Supplier Order</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Product</label>
          <select value={productId} onChange={(e) => setProductId(Number(e.target.value) || "")} className="mt-1 w-full border rounded px-2 py-1" required>
            <option value="">Select product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Supplier name</label>
          <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 w-full border rounded px-2 py-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Delivery date</label>
            <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="mt-1 w-full border rounded px-2 py-1" required />
          </div>
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="text-right">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? "Creating..." : "Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
}