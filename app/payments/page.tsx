"use client";

import React, { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(`${API_BASE}/api/payments`, {
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        if (!res.ok) throw new Error(`Failed to load payments (${res.status})`);
        const body = await res.json();

        // Normalize: prefer array, try common shapes
        let list: any[] = [];
        if (Array.isArray(body)) list = body;
        else if (Array.isArray(body.data)) list = body.data;
        else if (Array.isArray(body.items)) list = body.items;
        else if (Array.isArray(body.payments)) list = body.payments;
        else if (body && typeof body === "object") {
          // if single object, wrap it
          list = body ? [body] : [];
        }

        if (mounted) setPayments(list);
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load payments");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading payments...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (!Array.isArray(payments) || payments.length === 0) return <div>No payments found</div>;

  return (
    <div>
      <h1>Payments</h1>
      <ul>
        {payments.map((p: any) => (
          <li key={p.id ?? p.paymentId ?? Math.random()}>
            <div><strong>Payment ID:</strong> {p.id ?? p.paymentId}</div>
            <div><strong>Order ID:</strong> {p.orderId ?? "-"}</div>
            <div><strong>Amount:</strong> {p.amount ?? p.total ?? "-"}</div>
            <div><strong>Method:</strong> {p.method ?? p.paymentMethod ?? "-"}</div>
            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}