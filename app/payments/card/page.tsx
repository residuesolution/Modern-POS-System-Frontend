"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { processPayment, createBill } from "../../../services/authService";
import PaymentSuccess from "../../../components/PaymentSuccess";

export default function PaymentMethodPage() {
  const router = useRouter();
  const pathname = usePathname();
  const method = (pathname?.split("/")?.pop() || "card").toUpperCase();
  const [cart, setCart] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // countdown seconds for success screen (60 seconds)
  const [countdown, setCountdown] = useState<number>(60);
  const redirectDelayMs = 60_000; // 60 seconds

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_cart");
      const rawMeta = sessionStorage.getItem("checkout_meta");
      if (!raw) {
        router.push("/");
        return;
      }
      setCart(JSON.parse(raw));
      setMeta(rawMeta ? JSON.parse(rawMeta) : null);
    } catch (e) {
      console.error("Failed to load checkout cart", e);
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!successData) return;

    // start countdown timer
    setCountdown(Math.ceil(redirectDelayMs / 1000));
    const interval = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // auto-redirect after delay
    const t = setTimeout(() => {
      router.push("/dashboard");
    }, redirectDelayMs);

    return () => {
      clearInterval(interval);
      clearTimeout(t);
    };
  }, [successData, router]);

  const totals = useMemo(() => {
    const subtotal = (cart || []).reduce(
      (s: number, it: any) => s + ((it.product?.price || 0) * (it.qty || 1)),
      0
    );
    const discount = Math.round(subtotal * 0.1);
    const tax = Math.round(subtotal * 0.15);
    const grand = subtotal - discount + tax;
    return { subtotal, discount, tax, grand };
  }, [cart]);

  // local card inputs
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardBrand, setCardBrand] = useState<"visa" | "mastercard">("visa");

  function maskCardInput(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  async function handleSubmit(ev?: React.FormEvent) {
    ev?.preventDefault();
    if (!cart || cart.length === 0) {
      setMessage("Cart is empty");
      return;
    }

    if (method === "CARD") {
      const digits = cardNumber.replace(/\D/g, "");
      if (!digits || digits.length < 12) {
        setMessage("Enter a valid card number.");
        return;
      }
      if (!cardHolder.trim()) {
        setMessage("Enter card holder name.");
        return;
      }
      if (!cardBrand) {
        setMessage("Select card brand.");
        return;
      }
      // Note: In production use tokenization and never send raw PAN/CVV to your backend.
    }

    setLoading(true);
    setMessage(null);
    try {
      const payload: any = {
        paymentMethod: method.toLowerCase(),
        amount: totals.grand,
        cart: cart.map((it: any) => ({
          productId: it.product.id,
          quantity: it.qty,
          unitPrice: it.product.price,
        })),
        metadata: {
          note: `Checkout via ${method}`,
        },
        userId: Number(meta?.user?.id ?? localStorage.getItem("userId") ?? null),
      };

      if (method === "CARD") {
        payload.metadata.cardNumber = cardNumber.replace(/\s/g, "");
        payload.metadata.cardHolderName = cardHolder;
        payload.metadata.cardBrand = cardBrand;
        payload.metadata.expiry = expiry;
        // Do not include cvv in production; for demo only:
        payload.metadata.cvv = cvv;
      }

      if (method === "CASH" || method === "LOYALTY" || method === "WALLET") {
        await createBill({ order: { total_amount: totals.grand }, items: payload.cart });
        setMessage("Order created");
        // flag for dashboard/payments refresh
        try { localStorage.setItem("order-created", Date.now().toString()); } catch {}
        setTimeout(() => router.push("/dashboard"), 800);
      } else {
        // process card payment
        const created = await processPayment(payload); // returns backend data (PaymentResponse)
        setMessage("Payment processed");

        // mark local flag for other pages to refresh
        try { localStorage.setItem("order-created", Date.now().toString()); } catch {}

        // show success component and start countdown + redirect after 60s
        setSuccessData(created);
      }

      try {
        sessionStorage.removeItem("checkout_cart");
        sessionStorage.removeItem("checkout_meta");
      } catch {}
    } catch (err: any) {
      console.error("payment error", err);
      setMessage(err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  // When successData is present render success UI + countdown and allow early close
  if (successData) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center">
        <div className="max-w-2xl mx-auto bg-white p-4 rounded-lg shadow">
          <PaymentSuccess data={successData} onClose={() => router.push("/dashboard")} />
          <div className="mt-3 text-center text-sm text-gray-600">
            Returning to dashboard in <strong>{countdown}</strong> second{countdown === 1 ? "" : "s"}...
          </div>
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to dashboard now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Checkout — {method}</h2>

        <div className="mb-3 text-sm text-gray-700">
          <div>Items: {(cart || []).length}</div>
          <div>Subtotal: Rs. {totals.subtotal}</div>
          <div>Discount: Rs. {totals.discount}</div>
          <div>Tax: Rs. {totals.tax}</div>
          <div className="font-semibold">Grand: Rs. {totals.grand}</div>
        </div>

        {method === "CARD" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600">Card brand</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCardBrand("visa")}
                  className={`flex items-center gap-2 px-3 py-2 rounded border ${cardBrand === "visa" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                  aria-pressed={cardBrand === "visa"}
                >
                  <span className="text-sm font-medium">Visa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardBrand("mastercard")}
                  className={`flex items-center gap-2 px-3 py-2 rounded border ${cardBrand === "mastercard" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                  aria-pressed={cardBrand === "mastercard"}
                >
                  <span className="text-sm font-medium">Mastercard</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-600">Card holder name</label>
              <input required type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="John Doe" className="w-full border p-2 rounded" />
            </div>

            <div>
              <label className="block text-xs text-gray-600">Card number (demo)</label>
              <input required type="text" value={cardNumber} onChange={(e) => setCardNumber(maskCardInput(e.target.value))} name="card" placeholder="4242 4242 4242 4242" className="w-full border p-2 rounded" />
            </div>

            <div className="flex gap-2">
              <input required type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} name="expiry" placeholder="MM/YY" className="w-1/2 border p-2 rounded" />
              <input required type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} name="cvv" placeholder="CVV" className="w-1/2 border p-2 rounded" />
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
                {loading ? "Processing..." : "Pay now"}
              </button>
              <button type="button" onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            </div>
          </form>
        )}

        {method !== "CARD" && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Proceed with {method} payment</div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
                {loading ? "Processing..." : "Complete"}
              </button>
              <button onClick={() => router.push("/")} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            </div>
          </div>
        )}

        {message && <div className="mt-3 text-sm">{message}</div>}
      </div>
    </div>
  );
}