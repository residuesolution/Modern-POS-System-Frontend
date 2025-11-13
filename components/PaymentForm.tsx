"use client";
import React, { useMemo, useState } from "react";

type CartItem = { product: any; qty: number };

export default function PaymentForm({
  method,
  cart,
  onPay
}: {
  method: "CASH" | "CARD" | "LOYALTY" | "WALLET";
  cart: CartItem[];
  onPay: (payload: any) => Promise<void>;
}) {
  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, it) => s + (it.product?.price || it.product?.unit_price || 0) * it.qty, 0);
    const discount = Math.round(subtotal * 0.10);
    const tax = Math.round(subtotal * 0.15);
    const grand = subtotal - discount + tax;
    return { subtotal, discount, tax, grand };
  }, [cart]);

  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [walletId, setWalletId] = useState("");

  async function submit() {
    setProcessing(true);
    try {
      const payload = {
        paymentMethod: method,
        amount: totals.grand,
        metadata: {
          cardNumber: method === "CARD" ? cardNumber : undefined,
          phone: method === "LOYALTY" ? phone : undefined,
          walletId: method === "WALLET" ? walletId : undefined,
        },
      };
      await onPay(payload);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Pay with {method}</h3>

      <div className="text-sm mb-3">
        <div>Subtotal: Rs. {totals.subtotal}</div>
        <div>Discount: Rs. {totals.discount}</div>
        <div>Tax: Rs. {totals.tax}</div>
        <div className="font-semibold">Grand: Rs. {totals.grand}</div>
      </div>

      {method === "CARD" && (
        <div className="mb-2">
          <label className="text-xs">Card number</label>
          <input value={cardNumber} onChange={(e)=>setCardNumber(e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="4242 4242 4242 4242"/>
        </div>
      )}

      {method === "LOYALTY" && (
        <div className="mb-2">
          <label className="text-xs">Phone / Loyalty ID</label>
          <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full border p-2 rounded mt-1"/>
        </div>
      )}

      {method === "WALLET" && (
        <div className="mb-2">
          <label className="text-xs">Wallet identifier</label>
          <input value={walletId} onChange={(e)=>setWalletId(e.target.value)} className="w-full border p-2 rounded mt-1"/>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={submit} disabled={processing} className="px-4 py-2 bg-blue-600 text-white rounded">
          {processing ? "Processing..." : `Pay Rs. ${totals.grand}`}
        </button>
      </div>
    </div>
  );
}