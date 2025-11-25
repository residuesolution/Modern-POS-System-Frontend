"use client";
import { useState } from "react";
import { searchProducts, searchOrders } from "../services/authService";  // Ensure this function is correctly defined in authService

export default function SearchBar({ onSelect }: { onSelect?: (item: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"products" | "orders">("products");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const q = (query || "").trim();
    if (!q) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const raw = type === "products"
        ? await searchProducts(q)
        : await searchOrders(q);

      // normalize different possible backend shapes
      const normalized = Array.isArray(raw)
        ? raw
        : raw?.data || raw?.items || [];

      console.debug("[SearchBar] query=", q, "type=", type, "raw=", raw, "normalized=", normalized);
      setResults(Array.isArray(normalized) ? normalized : []);
    } catch (err: any) {
      console.error("[SearchBar] search error:", err);
      setError(err?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <select
          value={type}
          onChange={e => setType(e.target.value as any)}
          className="border px-2 rounded-lg"
        >
          <option value="products">Products</option>
          <option value="orders">Orders</option>
        </select>

        <input
          type="text"
          placeholder={`Search ${type}...`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border px-3 py-2 rounded-lg w-64"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}

      {!loading && results.length === 0 && query.trim() !== "" && !error && (
        <div className="text-xs text-gray-600 mt-2">No results found.</div>
      )}

      {results.length > 0 && (
        <ul className="bg-white border rounded-lg mt-2 max-h-40 overflow-y-auto">
          {results.map((item, idx) => (
            <li
              key={item.id || item._id || idx}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => onSelect?.(item)}
            >
              {type === "products"
                ? `${item.name || item.productName || item.title || "Unnamed"} (${item.barcode || item.sku || ""})`
                : `Order #${item.id || item.orderId || idx} (${item.customerName || item.customer || ""})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
