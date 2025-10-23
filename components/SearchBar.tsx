"use client";
import { useState } from "react";
import { searchProducts, searchOrders } from "../services/authService";

export default function SearchBar({ onSelect }: { onSelect?: (item: any) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"products" | "orders">("products");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = type === "products"
        ? await searchProducts(query)
        : await searchOrders(query);
      setResults(data as any[]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value as any)} className="border px-2 rounded-lg">
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
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Search</button>
      </form>
      {loading && <div className="text-xs text-blue-700 mt-2">Searching...</div>}
      {results.length > 0 && (
        <ul className="bg-white border rounded-lg mt-2 max-h-40 overflow-y-auto">
          {results.map((item, idx) => (
            <li
              key={item.id || idx}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => onSelect?.(item)}
            >
              {type === "products"
                ? `${item.name} (${item.barcode})`
                : `Order #${item.id} (${item.customerName || ""})`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}