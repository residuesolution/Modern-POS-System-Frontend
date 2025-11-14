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

interface ProductForm {
  name: string;
  category_id: string;
  category_name: string; // Add category_name
  sku: string;
  price: string;
  cost_price: string;
  stock: string;
  low_stock_alert_threshold: string;
  status: boolean;
  image_file?: File;
  image_preview?: string;
}

export default function AddProductPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [categories, setCategories] = useState([
    { id: "1", name: "Electronics" },
    { id: "2", name: "Clothing" },
    { id: "3", name: "Books" },
    { id: "4", name: "Food" },
  ]);

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
    image_file: undefined,
    image_preview: "",
  });

  // Fetch user
  useEffect(() => {
    (async () => {
      try {
        const userData = await fetchCurrentUser();
        const currentUser = userData?.user || userData?.data || userData || null;
        setUser(currentUser as User | null);

        if (!currentUser || !["ADMIN", "MANAGER", "CASHIER"].includes(currentUser.role)) {
          router.replace("/unauthorized");
        }
      } catch {
        router.replace("/unauthorized");
      }
    })();
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // Automatically set category_name when category_id changes
      ...(name === "category_id"
        ? { category_name: categories.find((c) => c.id === value)?.name || "" }
        : {}),
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image_file: file,
        image_preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("authToken"); // JWT token stored after login
      if (!token) throw new Error("User not authenticated");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const body = new FormData();
      body.append("name", formData.name);
      body.append("category_id", formData.category_id);
      body.append("category_name", formData.category_name); // send category_name
      body.append("sku", formData.sku);
      body.append("price", formData.price);
      body.append("cost_price", formData.cost_price);
      body.append("stock", formData.stock);
      body.append("low_stock_alert_threshold", formData.low_stock_alert_threshold);
      body.append("status", formData.status ? "true" : "false");
      if (formData.image_file) body.append("image", formData.image_file);

      const res = await fetch(`${apiUrl}/api/product/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Important for 401
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
    <div className="flex min-h-screen bg-gray-50">
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
                  className="w-full border border-gray-300 p-2 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SKU, price, stock, etc. */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 p-2 rounded-md"
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
                  className="w-full border border-gray-300 p-2 rounded-md"
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
                  className="w-full border border-gray-300 p-2 rounded-md"
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
                  className="w-full border border-gray-300 p-2 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                <input
                  type="number"
                  name="low_stock_alert_threshold"
                  value={formData.low_stock_alert_threshold}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md"
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium mb-2">Product Image</label>
              <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center relative bg-gray-50">
                {!formData.image_preview ? (
                  <>
                    <p className="text-gray-500">Click to upload image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </>
                ) : (
                  <div className="relative inline-block">
                    <img src={formData.image_preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_preview: "", image_file: undefined }))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="status"
                checked={formData.status}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <label className="text-sm">Product is Active</label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 rounded-md text-white font-semibold ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
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
