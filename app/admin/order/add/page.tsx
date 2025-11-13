'use client';
import React, { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import TopNavBar from "@/components/TopNavBar";
import ProfileHeader from "@/components/ProfileHeader";
import { fetchCurrentUser } from "@/services/authService";

interface Product {
  id: number;
  name: string;
  category_id: number;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  low_stock_alert_threshold: number;
  image_url?: string;
  status: boolean;
}

interface User {
  role: string;
  name?: string;
  profilePhoto?: string;
  [key: string]: any;
}

export default function ProductListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [supplierOrdersLoading, setSupplierOrdersLoading] = useState<boolean>(true);
  const [supplierOrdersError, setSupplierOrdersError] = useState<string>("");

  useEffect(() => {
    async function getUserAndProducts() {
      setLoading(true);
      setError(null);
      try {
        const userData = await fetchCurrentUser();
        const currentUser =
          userData && typeof userData === "object" && "user" in userData && userData.user
            ? userData.user
            : userData && typeof userData === "object" && "data" in userData && userData.data
            ? userData.data
            : userData;
        setUser(currentUser as User | null);

        if (
          !currentUser ||
          typeof currentUser !== "object" ||
          currentUser === null ||
          !("role" in (currentUser as Record<string, any>)) ||
          !["ADMIN", "MANAGER"].includes((currentUser as User).role)
        ) {
          router.replace("/unauthorized");
          return;
        }

        // fetch products
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const resp = await fetch(`${apiUrl}/api/product`, { headers });
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          throw new Error(`Failed to fetch products: ${resp.status} ${txt}`);
        }
        const payload = await resp.json();
        const list: any[] = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
        setProducts(list.map((p: any) => ({
          id: p.id,
          name: p.name,
          category_id: Number(p.category_id ?? p.categoryId ?? 0),
          sku: p.sku,
          price: Number(p.price ?? 0),
          cost_price: Number(p.cost_price ?? p.costPrice ?? 0),
          stock: Number(p.stock ?? 0),
          low_stock_alert_threshold: Number(p.low_stock_alert_threshold ?? p.lowStockAlertThreshold ?? 0),
          image_url: p.image_url ?? p.imageUrl ?? p.image,
          status: p.status === true || p.status === "1" || p.status === 1,
        })));
      } catch (err: any) {
        setError(err?.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }

    getUserAndProducts();
  }, [router]);

  useEffect(() => {
    async function fetchSupplierOrders() {
      setSupplierOrdersLoading(true);
      setSupplierOrdersError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/api/orders`, { headers });
        if (!res.ok) {
          let serverMsg = "";
          try {
            const json = await res.json();
            serverMsg = JSON.stringify(json);
          } catch {
            serverMsg = await res.text().catch(() => "");
          }
          throw new Error(`Server responded ${res.status}: ${serverMsg}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
        setSupplierOrders(list);
      } catch (err: any) {
        console.error("fetchSupplierOrders error:", err);
        setSupplierOrdersError(err?.message || "Failed to fetch supplier orders.");
      } finally {
        setSupplierOrdersLoading(false);
      }
    }

    fetchSupplierOrders();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/api/product/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${txt}`);
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || "Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-blue-700 text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-700 text-center py-8">{error}</div>;

  return (
    <div className="flex max-h-screen bg-gray-150">
      <div className="flex-1 flex flex-col">
        <TopNavBar user={user || { name: "Admin", role: "ADMIN" }} onSearch={() => {}} />
        <main className="flex-1 p-6 mt-20">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex gap-30"> {/* Use Flexbox for horizontal layout */}
              
              {/* Product List */}
              <div className="bg-white p-8 rounded shadow flex-23">
                <h2 className="font-semibold text-lg mb-3">Products</h2>
                <div className={`overflow-x-auto ${products.length > 3 ? "max-h-60 overflow-y-auto" : ""}`}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2 px-2">ID</th>
                        <th className="py-2">Name</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Price</th>
                        <th className="py-2 px-1">Stock</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="py-2">{p.id}</td>
                          <td className="py-2">{p.name}</td>
                          <td className="py-2">{p.sku}</td>
                          <td className="py-2">Rs. {p.price}</td>
                          <td className="py-2">{p.stock}</td>
                          <td className="py-2">
                            <button onClick={() => router.push(`/admin/product/edit/${p.id}`)} className="text-blue-600 mr-3">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="text-red-600">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white p-4 rounded shadow flex-12">
                <h2 className="font-semibold text-lg mb-3">Recent Orders</h2>
                {supplierOrdersLoading ? (
                  <div className="text-xs text-blue-700">Loading orders...</div>
                ) : supplierOrdersError ? (
                  <div className="text-xs text-red-600">Error: {supplierOrdersError}</div>
                ) : supplierOrders.length === 0 ? (
                  <div className="text-xs text-gray-600">No orders found.</div>
                ) : (
                  <div className={`${supplierOrders.length > 3 ? "max-h-60 overflow-y-auto" : ""}`}>
                    <ul className="space-y-2">
                      {supplierOrders.slice(0, 10).map((o: any) => (
                        <li key={o.id} className="p-4 border rounded flex items-center justify-between">
                          <div>
                            <div className="font-semibold">#{o.id} — {o.customer_id ? `Customer ${o.customer_id}` : "Walk-in"}</div>
                            <div className="text-xs text-gray-600">Items: {o.items?.length ?? o.totalItems ?? 0}</div>
                          </div>
                          <div className="text-blue-800 font-semibold">Rs. {o.total_amount ?? o.totalAmount ?? 0}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div> {/* End of flex container */}
          </div>
        </main>
      </div>
    </div>
  );
}
