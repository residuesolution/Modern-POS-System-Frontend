"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PaymentForm from "../../../../components/PaymentForm";
import PaymentSuccess from "../../../../components/PaymentSuccess";
import { processPayment } from "../../../../services/paymentService";

export default function PaymentPage() {
  const { method } = useParams() as { method?: string };
  const router = useRouter();
  const m = (method || "cash").toUpperCase();
  const [cart, setCart] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const json = sessionStorage.getItem("checkout_cart");
      setCart(json ? JSON.parse(json) : []);
    } catch {
      setCart([]);
    }
  }, []);

  async function onPay(payload: any) {
    setError(null);
    try {
      const body = { method: m, cart, amount: payload.amount, metadata: payload.metadata || {} };
      const res = await processPayment(body);
      setResult(res);
      sessionStorage.removeItem("checkout_cart");
    } catch (err: any) {
      setError(err?.message || "Payment failed");
    }
  }

  if (result) {
    return <div className="p-6 max-w-lg mx-auto"><PaymentSuccess data={result} onClose={() => router.push("/")} /></div>;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold mb-4">Checkout — {m}</h2>
      {cart.length === 0 ? (
        <div className="p-4 bg-white rounded">Cart empty. <button className="underline ml-2" onClick={()=>router.push("/")}>Back</button></div>
      ) : (
        <PaymentForm method={m as any} cart={cart} onPay={onPay} />
      )}
      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
}