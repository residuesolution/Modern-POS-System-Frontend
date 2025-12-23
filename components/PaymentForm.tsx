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
  onPay: (payload: any) => Promise<any>;
}) {
  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (s, it) => s + (it.product?.price ?? it.product?.unit_price ?? 0) * it.qty,
      0
    );
    const discount = Math.round(subtotal * 0.1);
    const tax = Math.round(subtotal * 0.15);
    const grand = subtotal - discount + tax;
    return { subtotal, discount, tax, grand };
  }, [cart]);

  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard">("visa");
  const [phone, setPhone] = useState("");
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function formatCurrency(v: number) {
    return `Rs. ${v.toLocaleString()}`;
  }

  function maskCardInput(raw: string) {
    // keep only digits, group by 4
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function validate(): string | null {
    if (method === "CARD") {
      const digits = cardNumber.replace(/\D/g, "");
      if (!digits) return "Card number is required.";
      if (digits.length < 12) return "Enter a valid card number.";
      if (!cardHolderName.trim()) return "Card holder name is required.";
      if (!cardBrand) return "Select card brand.";
    }
    if (method === "LOYALTY") {
      if (!phone.trim()) return "Phone / Loyalty ID is required.";
    }
    if (method === "WALLET") {
      if (!walletId.trim()) return "Wallet ID is required.";
    }
    if (totals.grand <= 0) return "Cart is empty or amount is zero.";
    return null;
  }

  async function submit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setError(null);
    setProcessing(true);
    try {
      // Build payload; DO NOT include CVV or full PAN for production.
      const payload = {
        paymentMethod: method.toLowerCase(),
        amount: totals.grand,
        metadata: {
          cardNumber: method === "CARD" ? cardNumber.replace(/\s/g, "") : undefined,
          cardHolderName: method === "CARD" ? cardHolderName : undefined,
          cardBrand: method === "CARD" ? cardBrand : undefined,
          phone: method === "LOYALTY" ? phone : undefined,
          walletId: method === "WALLET" ? walletId : undefined
        },
        cart
      };
      const res = await onPay(payload);
      setSuccessMessage("Payment completed");
      return res;
    } catch (err: any) {
      setError(err?.message ?? "Payment failed");
      throw err;
    } finally {
      setProcessing(false);
    }
  }

  function VisaIcon({ className = "h-6 w-8" }: { className?: string }) {
    // simplified, valid SVG for Visa-like mark (avoids malformed path)
    return (
      <svg viewBox="0 0 48 32" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Visa">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <path d="M12 9 L18 22 L21 22 L27 9 L23 9 L20 18 L17 9 Z" fill="#fff" />
      </svg>
    );
  }

  function MastercardIcon({ className = "h-6 w-8" }: { className?: string }) {
    return (
      <svg viewBox="0 0 48 32" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mastercard">
        <rect width="48" height="32" rx="4" fill="#fff" />
        <circle cx="20" cy="16" r="8" fill="#eb001b" />
        <circle cx="28" cy="16" r="8" fill="#f79e1b" />
      </svg>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pay with {method}</h3>
        <div className="text-sm text-gray-600">{formatCurrency(totals.grand)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
        <div>Subtotal: {formatCurrency(totals.subtotal)}</div>
        <div>Discount: {formatCurrency(totals.discount)}</div>
        <div>Tax: {formatCurrency(totals.tax)}</div>
        <div className="font-medium">Grand: {formatCurrency(totals.grand)}</div>
      </div>

      {method === "CARD" && (
        <>
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Card brand</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCardBrand("visa")}
                className={`flex items-center gap-2 px-3 py-2 rounded border ${cardBrand === "visa" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                aria-pressed={cardBrand === "visa"}
              >
                <VisaIcon />
                <span className="text-sm font-medium">Visa</span>
              </button>

              <button
                type="button"
                onClick={() => setCardBrand("mastercard")}
                className={`flex items-center gap-2 px-3 py-2 rounded border ${cardBrand === "mastercard" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                aria-pressed={cardBrand === "mastercard"}
              >
                <MastercardIcon />
                <span className="text-sm font-medium">Mastercard</span>
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Card holder name</label>
            <input
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              placeholder="Name on card"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">Card number</label>
            <input
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => setCardNumber(maskCardInput(e.target.value))}
              placeholder="4242 4242 4242 4242"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300"
            />
            <div className="text-xs text-gray-500 mt-1">We use a secure processor — only last 4 digits are shown on receipts.</div>
          </div>
        </>
      )}

      {method === "LOYALTY" && (
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Phone / Loyalty ID</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300"
          />
        </div>
      )}

      {method === "WALLET" && (
        <div className="mb-3">
          <label className="block text-xs font-medium mb-1">Wallet identifier</label>
          <input
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            placeholder="wallet@example"
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-300"
          />
        </div>
      )}

      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {successMessage && <div className="text-sm text-green-700 mb-3">{successMessage}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={processing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {processing ? (
            <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : null}
          {processing ? "Processing..." : `Pay ${formatCurrency(totals.grand)}`}
        </button>

        <button
          type="button"
          onClick={() => {
            setCardNumber("");
            setCardHolderName("");
            setCardBrand("visa");
            setPhone("");
            setWalletId("");
            setError(null);
            setSuccessMessage(null);
          }}
          className="px-3 py-2 border rounded text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
}