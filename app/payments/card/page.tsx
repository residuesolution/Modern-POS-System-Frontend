"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { processPayment, createBill } from "../../../services/authService";

export default function PaymentMethodPage() {
  const router = useRouter();
  const pathname = usePathname();
  const method = (pathname?.split("/")?.pop() || "card").toUpperCase();
  const [cart, setCart] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_cart");
      const rawMeta = sessionStorage.getItem("checkout_meta");
      if (!raw) {
        // no cart -> redirect to dashboard
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

  const totals = useMemo(() => {
    const subtotal = (cart || []).reduce((s: number, it: any) => s + ((it.product?.price || 0) * (it.qty || 1)), 0);
    const discount = Math.round(subtotal * 0.1);
    const tax = Math.round(subtotal * 0.15);
    const grand = subtotal - discount + tax;
    return { subtotal, discount, tax, grand };
  }, [cart]);

  async function handleSubmit(ev?: React.FormEvent) {
    ev?.preventDefault();
    if (!cart || cart.length === 0) {
      setMessage("Cart is empty");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // Compose payload (adjust to your backend shape)
      const payload = {
        paymentMethod: method,
        amount: totals.grand,
        cart: cart.map((it: any) => ({
          productId: it.product.id,
          quantity: it.qty,
          unitPrice: it.product.price,
        })),
        metadata: {
          // DO NOT send real card data in plain text in production
          note: `Checkout via ${method}`,
        },
        userId: Number(meta?.user?.id ?? localStorage.getItem("userId") ?? null),
      };

      // For offline methods you might create an order directly
      if (method === "CASH" || method === "LOYALTY" || method === "WALLET") {
        await createBill({ order: { /* minimal order */ total_amount: totals.grand }, items: payload.cart });
        setMessage("Order created");
      } else {
        // Attempt to process payment
        await processPayment(payload);
        setMessage("Payment processed");
      }

      // signal other tabs/components and clear cart
      try {
        sessionStorage.removeItem("checkout_cart");
        sessionStorage.removeItem("checkout_meta");
        localStorage.setItem("order-created", Date.now().toString());
      } catch {}
      // short delay so user sees success
      setTimeout(() => router.push("/"), 800);
    } catch (err: any) {
      console.error("payment error", err);
      setMessage(err?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
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
              <label className="block text-xs text-gray-600">Card number (demo)</label>
              <input required type="text" name="card" placeholder="4242 4242 4242 4242" className="w-full border p-2 rounded" />
            </div>
            <div className="flex gap-2">
              <input required type="text" name="expiry" placeholder="MM/YY" className="w-1/2 border p-2 rounded" />
              <input required type="text" name="cvv" placeholder="CVV" className="w-1/2 border p-2 rounded" />
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