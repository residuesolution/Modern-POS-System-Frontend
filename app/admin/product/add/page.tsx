'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import { fetchCurrentUser } from "@/services/authService";

type User = {
  name: string;
  role: string;
  profilePhoto?: string;
  [key: string]: any;
};

interface Category {
  category_id: number;
  category_name: string;
  description?: string;
}

interface ProductForm {
  name: string;
  category_id: string;
  category_name: string;
  sku: string;
  price: string;
  cost_price: string;
  stock: string;
  low_stock_alert_threshold: string;
  status: boolean;
}

export default function AddProductPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    category_id: "",
    category_name: "",
    sku: "",
    price: "",
    cost_price: "",
    stock: "",
    low_stock_alert_threshold: "",
    status: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const userData = await fetchCurrentUser();
        const currentUser = (userData as any)?.user || (userData as any)?.data || userData || null;
        setUser(currentUser as User | null);

        if (!currentUser || !["ADMIN", "MANAGER", "CASHIER"].includes(currentUser.role)) {
          router.replace("/unauthorized");
          return;
        }

        const authToken = localStorage.getItem("authToken");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const catRes = await fetch(`${apiUrl}/api/category`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });

        if (catRes.ok) {
          const catData = await catRes.json();
          const catList = Array.isArray(catData) ? catData : catData?.data || catData?.items || [];
          setCategories(catList);
        } else {
          console.error("Failed to fetch categories");
          setCategories([]);
        }
      } catch (err) {
        console.error("Error fetching user or categories:", err);
        router.replace("/unauthorized");
      } finally {
        setCategoriesLoading(false);
      }
    })();
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "category_id"
        ? { category_name: categories.find((c) => String(c.category_id) === value)?.category_name || "" }
        : {}),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("User not authenticated");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      const body = JSON.stringify({
        name: formData.name,
        category_id: parseInt(formData.category_id),
        category_name: formData.category_name,
        sku: formData.sku,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        stock: parseInt(formData.stock),
        low_stock_alert_threshold: parseInt(formData.low_stock_alert_threshold) || 0,
        status: formData.status,
      });

      const res = await fetch(`${apiUrl}/api/product/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error ${res.status}: ${text}`);
      }

      setSuccess("✅ Product added successfully!");
      setTimeout(() => router.push("/admin/product/view"), 800);
    } catch (err: any) {
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-8 text-blue-600">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-50">
      <main className="flex-1 p-8">
        <ProfileHeader name={user.name} role={user.role} profilePhoto={user.profilePhoto} />

        <div className="bg-white shadow-xl rounded-2xl p-8 mt-10 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6">Add New Product</h1>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                {categoriesLoading ? (
                  <div className="w-full border border-gray-300 p-2 rounded-md bg-gray-100 text-gray-500">
                    Loading categories...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="w-full border border-gray-300 p-2 rounded-md bg-red-50 text-red-600 text-sm">
                    No categories available. <a href="/admin/category/add" className="underline font-bold">Add one</a>
                  </div>
                ) : (
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={String(c.category_id)}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  required
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost Price ($)</label>
                <input
                  type="number"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleChange}
                  step="0.01"
                  required
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                <input
                  type="number"
                  name="low_stock_alert_threshold"
                  value={formData.low_stock_alert_threshold}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                className="w-5 h-5 cursor-pointer"
              />
              <label className="text-sm cursor-pointer">Product is Active</label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || categoriesLoading}
                className={`flex-1 py-3 rounded-md text-white font-semibold ${
                  loading || categoriesLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "⏳ Saving..." : "💾 Save Product"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/product/view")}
                className="flex-1 py-3 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                🚫 Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}