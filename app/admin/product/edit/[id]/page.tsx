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
  status: boolean;
}

interface User {
  role: string;
  name?: string;
  profilePhoto?: string;
}

interface Category {
  id?: number;
  category_id?: number;
  name?: string;
  category_name?: string;
}

// Reusable input component
// Reusable input component
const InputField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: any;
  onChange: (e: any) => void;
  step?: string;
  placeholder?: string;
}> = ({ label, name, type = 'text', value, onChange, step, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      step={step}
      placeholder={placeholder}
      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    />
  </div>
);

// Dropdown with normalized categories
const SelectField: React.FC<{
  label: string;
  name: string;
  value: any;
  onChange: (e: any) => void;
  options: Category[];
}> = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
    >
      <option value="">Select a category</option>
      {options.map((opt) => {
        const catId = opt.category_id ?? opt.id;
        const catName = opt.category_name ?? opt.name ?? `Category ${catId}`;
        return (
          <option key={catId} value={catId}>
            {catName}
          </option>
        );
      })}
    </select>
  </div>
);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});

  const [formData, setFormData] = useState<any>({
    name: '',
    category_id: '',
    sku: '',
    price: '',
    cost_price: '',
    stock: '',
    low_stock_alert_threshold: '',
    status: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ---------------------------
  // Fetch Product + User + Categories
  // ---------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current user
        const userData = await fetchCurrentUser();
        const currentUser = (userData as any)?.user || (userData as any)?.data || userData;
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

        // Fetch categories and normalize them
        const catRes = await fetch(`${apiUrl}/api/category`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (catRes.ok) {
          const catData = await catRes.json();
          const catList = Array.isArray(catData) ? catData : catData?.data || catData?.items || [];

          // Normalize categories: ensure all have both id/category_id and name/category_name
          const normalized = catList.map((c: any) => ({
            id: c.id ?? c.category_id,
            category_id: c.id ?? c.category_id,
            name: c.name ?? c.category_name,
            category_name: c.name ?? c.category_name,
          }));

          setCategories(normalized);

          // Build category ID -> Name map for quick lookup
          const map: Record<number, string> = {};
          normalized.forEach((c: any) => {
            map[c.category_id] = c.category_name;
          });
          setCategoryMap(map);
        }

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

        normalizeAndSet(productObj);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }

    function normalizeAndSet(p: any) {
      const normalized: Product = {
        id: Number(p.id ?? p.productId),
        name: p.name ?? p.productName ?? '',
        category_id: Number(p.category_id ?? p.categoryId ?? ''),
        sku: p.sku ?? p.code ?? '',
        price: Number(p.price ?? 0),
        cost_price: Number(p.cost_price ?? 0),
        stock: Number(p.stock ?? 0),
        low_stock_alert_threshold: Number(p.low_stock_alert_threshold ?? p.lowStockAlertThreshold ?? 0),
        status: Boolean(p.status ?? p.active ?? true),
      };

      setProduct(normalized);
      setFormData({
        ...normalized,
        category_id: String(normalized.category_id),
        price: String(normalized.price),
        cost_price: String(normalized.cost_price),
        stock: String(normalized.stock),
        low_stock_alert_threshold: String(normalized.low_stock_alert_threshold),
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

  // ---------------------------
  // Handle submit
  // ---------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Product name is required');
        setLoading(false);
        return;
      }

      if (!formData.category_id) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      if (!formData.sku.trim()) {
        setError('SKU is required');
        setLoading(false);
        return;
      }

      if (Number(formData.price) < 0) {
        setError('Price cannot be negative');
        setLoading(false);
        return;
      }

      if (Number(formData.stock) < 0) {
        setError('Stock cannot be negative');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      // Get category name from categoryMap
      const selectedCategoryName = categoryMap[parseInt(formData.category_id)] || '';

      const payload = JSON.stringify({
        name: formData.name.trim(),
        category_id: parseInt(formData.category_id),
        category_name: selectedCategoryName, // Include category name
        sku: formData.sku.trim(),
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price),
        stock: parseInt(formData.stock),
        low_stock_alert_threshold: parseInt(formData.low_stock_alert_threshold),
        status: formData.status,
      });

      const response = await fetch(`${apiUrl}/api/product/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: payload,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update product');
      }

      setSuccess('Product updated successfully');

      // Notify other tabs
      try {
        localStorage.setItem('product-updated', Date.now().toString());
      } catch {}

      // Redirect with cache-buster
      setTimeout(() => {
        router.push(`/admin/product/view?ts=${Date.now()}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Handle delete
  // ---------------------------
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const token = localStorage.getItem('authToken');

      const res = await fetch(`${apiUrl}/api/product/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to delete product');
      }

      // Notify other tabs
      try {
        localStorage.setItem('product-deleted', Date.now().toString());
      } catch {}

      router.push('/admin/product/view');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setLoading(false);
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1">
        <div className="px-8 py-4 flex items-center justify-between bg-white border-b border-gray-200">
          <ProfileHeader name={user?.name} role={user?.role} profilePhoto={user?.profilePhoto} />
        </div>

        <div className="p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l3 3M4 20l4-1 11-11a2.5 2.5 0 00-3.5-3.5L4 15l-1 4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Product</h2>
                <p className="text-sm text-gray-600">Update product details and information</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">{success}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <InputField 
                      label="Product Name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="Enter product name"
                    />

                    <SelectField
                      label="Product Category"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      options={categories}
                    />

                    <InputField 
                      label="SKU" 
                      name="sku" 
                      value={formData.sku} 
                      onChange={handleChange}
                      placeholder="Enter SKU"
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Pricing & Stock</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <InputField 
                        label="Selling Price" 
                        name="price" 
                        type="number" 
                        step="0.01" 
                        value={formData.price} 
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                      <InputField 
                        label="Cost Price" 
                        name="cost_price" 
                        type="number" 
                        step="0.01" 
                        value={formData.cost_price} 
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InputField 
                        label="Stock Quantity" 
                        name="stock" 
                        type="number" 
                        value={formData.stock} 
                        onChange={handleChange}
                        placeholder="0"
                      />
                      <InputField
                        label="Low Stock Alert Threshold"
                        name="low_stock_alert_threshold"
                        type="number"
                        value={formData.low_stock_alert_threshold}
                        onChange={handleChange}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="status"
                      id="status"
                      checked={!!formData.status}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Product Status</p>
                      <p className="text-xs text-gray-500">
                        {formData.status ? '✓ Active' : '○ Inactive'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/product/view')}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center space-x-3">
                    <button 
                      type="button" 
                      onClick={handleDelete} 
                      disabled={loading}
                      className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Deleting…' : 'Delete'}
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Saving…</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Save Changes</span>
                        </>
                      )}
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