"use client";
import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
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

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<any>({
    name: "",
    category_id: "",
    sku: "",
    price: "",
    cost_price: "",
    stock: "",
    low_stock_alert_threshold: "",
    image_url: "",
    status: false,
    image_file: undefined,
  });

  useEffect(() => {
    async function fetchData() {
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
        !("role" in currentUser) ||
        !["ADMIN", "MANAGER"].includes((currentUser as User).role)
      ) {
        router.replace("/unauthorized");
        return;
      }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const res = await fetch(`${apiUrl}/api/product/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);
        setFormData({
          name: data.name ?? "",
          // store category as string for controlled select; ensure not null
          category_id: data.category_id != null ? String(data.category_id) : "",
          sku: data.sku ?? "",
          // store numbers as strings to avoid controlled/uncontrolled issues
          price: data.price != null ? String(data.price) : "",
          cost_price: data.cost_price != null ? String(data.cost_price) : "",
          stock: data.stock != null ? String(data.stock) : "",
          low_stock_alert_threshold: data.low_stock_alert_threshold != null ? String(data.low_stock_alert_threshold) : "",
          image_url: data.image_url ?? "",
          status: !!data.status,
          image_file: undefined,
        });
      } catch (err: any) {
        setError(err?.message || "Failed to fetch product");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    // For number inputs we keep the raw string so controlled inputs never get null
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev: any) => ({
        ...prev,
        image_file: file,
        image_url: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name ?? "");
      // Convert category id to empty string or numeric string
      formDataToSend.append("category_id", formData.category_id ?? "");
      formDataToSend.append("sku", formData.sku ?? "");
      // Convert numeric string fields to proper string values for FormData
      formDataToSend.append("price", formData.price != null ? String(formData.price) : "");
      formDataToSend.append("cost_price", formData.cost_price != null ? String(formData.cost_price) : "");
      formDataToSend.append("stock", formData.stock != null ? String(formData.stock) : "");
      formDataToSend.append(
        "low_stock_alert_threshold",
        formData.low_stock_alert_threshold != null ? String(formData.low_stock_alert_threshold) : ""
      );
      formDataToSend.append("status", formData.status ? "1" : "0");
      if (formData.image_file) {
        formDataToSend.append("image", formData.image_file);
      }
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const response = await fetch(`${apiUrl}/api/product/update/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          // Do NOT set Content-Type for FormData
        },
        body: formDataToSend,
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update product: ${response.status} ${errText}`);
      }
      setSuccess("Product updated successfully!");
      setTimeout(() => {
        router.push("/admin/product/view");
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div className="text-blue-700 text-center py-8">Loading...</div>;
  if (!user || !product) return null;

  return (
    <div className="flex max-h-screen bg-gray-150">
      
      {/* Main Content */}
      <main className="flex-1 ml">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button 
                onClick={() => router.push('/admin/product/view')}
                className="hover:text-blue-600 transition-colors"
              >
                Products
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">Edit Product</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  {user?.name || 'User'}
                </div>
                <div className="text-xs text-gray-500 uppercase">
                  {user?.role || 'ROLE'}
                </div>
              </div>
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {user?.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt={user.name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name ?? ""}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Category
                        </label>
                        <select
                          name="category_id"
                          value={formData.category_id ?? ""}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Category</option>
                          <option value="1">Electronics</option>
                          <option value="2">Clothing</option>
                          <option value="3">Books</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          name="sku"
                          value={formData.sku ?? ""}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price ?? ""}
                            onChange={handleChange}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cost Price
                          </label>
                          <input
                            type="number"
                            name="cost_price"
                            value={formData.cost_price ?? ""}
                            onChange={handleChange}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            name="stock"
                            value={formData.stock ?? ""}
                            onChange={handleChange}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Low Stock Alert
                          </label>
                          <input
                            type="number"
                            name="low_stock_alert_threshold"
                            value={formData.low_stock_alert_threshold ?? ""}
                            onChange={handleChange}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Image
                        </label>
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50 hover:bg-blue-100 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="space-y-2">
                              <svg className="mx-auto h-12 w-12 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <div className="text-blue-600 text-sm">
                                <span className="font-medium">Click to upload</span> or drag and drop
                              </div>
                              <div className="text-xs text-blue-500">PNG, JPG, GIF up to 10MB</div>
                            </div>
                          </label>
                          {formData.image_url && (
                            <div className="mt-4">
                              <img
                                src={formData.image_url}
                                alt="Preview"
                                className="mx-auto h-32 w-32 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-4">
                        <input
                          type="checkbox"
                          name="status"
                          id="status"
                          checked={!!formData.status}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="status" className="text-sm font-medium text-gray-700">
                          Product is Active
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/product/view")}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProductPage;