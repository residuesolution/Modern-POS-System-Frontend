"use client";

import React, { useEffect, useState } from "react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("authToken") || ""}` },
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const body = await res.json();
      const data = body?.data ?? body;
      // if backend returns a Page object, you might need body.data.content
      const items = Array.isArray(data) ? data : (data?.content ?? data);
      setPayments(items || []);
    } catch (err) {
      console.error("fetchPayments error", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();

    // If an order/payment was just created, backend likely saved it.
    // The card page sets localStorage.order-created = timestamp.
    const created = localStorage.getItem("order-created");
    if (created) {
      // remove the flag and refresh payments
      localStorage.removeItem("order-created");
      fetchPayments();
    }

    // Optionally, listen to storage events from other tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (e.key === "order-created") {
        fetchPayments();
        try { localStorage.removeItem("order-created"); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Payments</h1>
      {loading ? (
        <div>Loading...</div>
      ) : payments.length === 0 ? (
        <div>No payments found</div>
      ) : (
        <ul className="space-y-3">
          {payments.map((p: any) => (
            <li key={p.id ?? p.paymentId} className="p-3 bg-white rounded shadow-sm flex justify-between items-center">
              <div>
                <div className="font-medium">#{p.id ?? p.paymentId} — Rs. {(p.amount ?? p.total ?? 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">{(p.paymentMethod ?? p.method) || "-"} • {(p.createdAt ?? p.created_at ?? "").toString()}</div>
              </div>
              <div className="text-sm text-gray-700">{p.status ?? p.paymentStatus ?? ""}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}