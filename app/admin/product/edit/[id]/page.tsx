'use client';

import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchCurrentUser } from '@/services/authService';
import ProfileHeader from '@/components/ProfileHeader';

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
}

// Reusable input component
const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: any;
  onChange: (e: any) => void;
}> = ({ label, name, type = 'text', value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    />
  </div>
);

// Dropdown
const SelectField: React.FC<{
  label: string;
  name: string;
  value: any;
  onChange: (e: any) => void;
  options: { id: string; name: string }[];
}> = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    >
      <option value="">Select a category</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.name}
        </option>
      ))}
    </select>
  </div>
);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    category_id: '',
    sku: '',
    price: '',
    cost_price: '',
    stock: '',
    low_stock_alert_threshold: '',
    image_url: '',
    status: false,
    image_file: undefined,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------------------------
  // Fetch Product + User
  // ---------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current user
        const userData = await fetchCurrentUser();
        const currentUser = userData?.user || userData?.data || userData;
        setUser(currentUser);

        if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
          router.replace('/unauthorized');
          return;
        }

        if (!id) {
          setError('Invalid Product ID');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

        // Fetch ALL products (backend issue) + search by id
        const res = await fetch(`${apiUrl}/api/product?ts=${Date.now()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        let productObj = null;

        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.data || data?.items || [];
          productObj = list.find((p: any) => String(p.id ?? p.productId) === String(id));
        }

        // fallback: search endpoint
        if (!productObj) {
          const searchRes = await fetch(`${apiUrl}/api/product/search?q=${encodeURIComponent(String(id))}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const searchData = await searchRes.json();
          const list = Array.isArray(searchData) ? searchData : searchData?.data || searchData?.items || [];
          productObj = list.find((p: any) => String(p.id ?? p.productId) === String(id));
        }

        if (!productObj) throw new Error('Product not found');

        normalizeAndSet(productObj, apiUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    function normalizeAndSet(p: any, apiUrl: string) {
      const normalized: Product = {
        id: Number(p.id ?? p.productId),
        name: p.name ?? p.productName ?? '',
        category_id: Number(p.category_id ?? p.categoryId ?? ''),
        sku: p.sku ?? p.code ?? '',
        price: Number(p.price ?? 0),
        cost_price: Number(p.cost_price ?? 0),
        stock: Number(p.stock ?? 0),
        low_stock_alert_threshold: Number(p.low_stock_alert_threshold ?? p.lowStockAlertThreshold ?? 0),
        image_url: p.image_url ?? p.image ?? p.imageUrl ?? '',
        status: Boolean(p.status ?? p.active ?? true),
      };

      let fullImageUrl =
        normalized.image_url && !normalized.image_url.startsWith('http')
          ? `${apiUrl}${normalized.image_url}`
          : normalized.image_url;

      setProduct(normalized);
      setFormData({
        ...normalized,
        category_id: String(normalized.category_id),
        price: String(normalized.price),
        cost_price: String(normalized.cost_price),
        stock: String(normalized.stock),
        low_stock_alert_threshold: String(normalized.low_stock_alert_threshold),
        image_url: fullImageUrl,
        image_file: undefined,
      });
    }

    fetchData();
  }, [id, router]);

  // ---------------------------
  // Handle form change
  // ---------------------------
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev: any) => ({
        ...prev,
        image_file: file,
        image_url: URL.createObjectURL(file), // instant preview
      }));
    }
  };

  // ---------------------------
  // Submit form
  // ---------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('category_id', formData.category_id);
      payload.append('sku', formData.sku);
      payload.append('price', formData.price);
      payload.append('cost_price', formData.cost_price);
      payload.append('stock', formData.stock);
      payload.append('low_stock_alert_threshold', formData.low_stock_alert_threshold);
      payload.append('status', formData.status ? '1' : '0');

      if (formData.image_file) payload.append('image', formData.image_file);

      const response = await fetch(`${apiUrl}/api/product/update/${id}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setSuccess('Product updated successfully');

      // Redirect with cache-buster
      router.push(`/admin/product/view?ts=${Date.now()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Delete
  // ---------------------------
  const handleDelete = async () => {
    if (!confirm('Delete this product?')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const token = localStorage.getItem('authToken');

      const res = await fetch(`${apiUrl}/api/product/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error(await res.text());

      router.push('/admin/product/view');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="flex max-h-screen bg-gray-100">
      <main className="flex-1">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => router.push('/admin/product/view')} className="hover:text-blue-600 transition-colors">
              Products
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Edit Product</span>
          </div>
          <ProfileHeader name={user?.name} role={user?.role} profilePhoto={user?.profilePhoto} />
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l3 3M4 20l4-1 11-11a2.5 2.5 0 00-3.5-3.5L4 15l-1 4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
            </div>

            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* LEFT */}
                  <div className="space-y-4">
                    <InputField label="Product Name" name="name" value={formData.name} onChange={handleChange} />

                    <SelectField
                      label="Product Category"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      options={[
                        { id: '1', name: 'Electronics' },
                        { id: '2', name: 'Clothing' },
                        { id: '3', name: 'Books' },
                      ]}
                    />

                    <InputField label="SKU" name="sku" value={formData.sku} onChange={handleChange} />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Price" name="price" type="number" value={formData.price} onChange={handleChange} />
                      <InputField label="Cost Price" name="cost_price" type="number" value={formData.cost_price} onChange={handleChange} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Stock" name="stock" type="number" value={formData.stock} onChange={handleChange} />
                      <InputField
                        label="Low Stock Alert"
                        name="low_stock_alert_threshold"
                        type="number"
                        value={formData.low_stock_alert_threshold}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">
                    {/* Current Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Image</label>

                      {formData.image_url ? (
                        <img
                          src={formData.image_url}
                          alt="Product"
                          loading="lazy"
                          className="w-40 h-40 object-cover rounded-lg border"
                        />
                      ) : (
                        <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center text-sm border text-gray-500">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Upload New */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Change Image</label>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-blue-50 hover:bg-blue-100 transition">
                        <input type="file" accept="image/*" id="image-upload" className="hidden" onChange={handleFileChange} />
                        <label htmlFor="image-upload" className="cursor-pointer inline-block px-4 py-2 bg-white rounded shadow text-sm text-blue-600">
                          Upload new image
                        </label>
                        <p className="text-xs text-blue-500 mt-2">PNG / JPG / up to 10MB</p>
                      </div>
                    </div>

                    {/* Status Toggle */}
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

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/product/view')}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center space-x-4">
                    <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Delete
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
