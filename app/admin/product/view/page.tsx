'use client';
import React, { useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/services/authService';
import { useRouter } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import { dedupeById } from '@/components/lib/utils';

interface Product {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  low_stock_alert_threshold: number;
  image_url: string;
  status: boolean;
}

interface User {
  role: string;
  name?: string;
  profilePhoto?: string;
  [key: string]: any;
}

// Safe price formatter
function formatPrice(value: number | null | undefined, decimals = 2) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(decimals) : (0).toFixed(decimals);
}

const ProductListPage = () => {
  const [supplierOrders, setSupplierOrders] = useState<any[]>([]);
  const [supplierOrdersLoading, setSupplierOrdersLoading] = useState<boolean>(true);
  const [supplierOrdersError, setSupplierOrdersError] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (product.name || "").toLowerCase().includes(term) ||
      (product.sku || "").toLowerCase().includes(term) ||
      (product.category_name || "").toLowerCase().includes(term) ||
      String(product.id).includes(term)
    );
  });

  useEffect(() => {
    async function getUserAndProducts() {
      try {
        const userData = await fetchCurrentUser();
        const currentUser =
          userData && typeof userData === 'object' && 'user' in userData && userData.user
            ? (userData.user as User)
            : userData && typeof userData === 'object' && 'data' in userData && userData.data
            ? (userData.data as User)
            : (userData as User);
        if (!currentUser || !['ADMIN', 'MANAGER', 'CASHIER'].includes(currentUser.role)) {
          router.replace('/unauthorized');
          return;
        }
        setUser(currentUser);

        let authToken = token;
        if (!authToken) {
          authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          setToken(authToken);
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

        // Fetch products
        const res = await fetch(`${apiUrl}/api/product`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        const rawProducts = Array.isArray(data) ? data : data?.data || data?.items || [];

        // Map products using backend category_name
        const mapped: Product[] = (rawProducts || []).map((p: any) => ({
          id: Number(p.id ?? p.productId) || Math.floor(Math.random() * 1e9),
          name: p.name ?? p.productName ?? 'Unnamed',
          category_id: Number(p.category_id ?? p.categoryId ?? 0),
          category_name: p.category_name ?? p.categoryName ?? "Uncategorized",
          sku: p.sku ?? p.code ?? '',
          price: Number(p.price) || 0,
          cost_price: Number(p.cost_price) || 0,
          stock: Number(p.stock) || 0,
          low_stock_alert_threshold: Number(p.low_stock_alert_threshold) || 0,
          image_url: p.image_url ?? p.image ?? '',
          status: Boolean(p.status ?? p.active ?? true),
        }));

        setProducts(dedupeById(mapped));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    getUserAndProducts();

    async function fetchSupplierOrders() {
      setSupplierOrdersLoading(true);
      setSupplierOrdersError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const res = await fetch(`${apiUrl}/api/supplier-order`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch supplier orders');
        const data = await res.json();
        setSupplierOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        setSupplierOrdersError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setSupplierOrdersLoading(false);
      }
    }
    fetchSupplierOrders();
  }, [router, token]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const res = await fetch(`${apiUrl}/api/product/${id}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = text || `Server responded with ${res.status}`;
        try {
          const json = text ? JSON.parse(text) : null;
          if (json && (json.error || json.message)) msg = json.error ?? json.message;
        } catch (_) { /* not JSON */ }
        throw new Error(msg);
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-blue-700 text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-700 text-center py-8">{error}</div>;

  return (
    <div className="min-h-screen bg-50">
      <div className="max-w-7xl mx-auto">
        <TopNavBar user={user || { name: 'Admin', role: 'ADMIN' }} onSearch={setSearchTerm} />

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Products list */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">Product Inventory</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your product catalog</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2.5 rounded-lg border border-blue-100">
                        <div className="text-xs text-blue-600 font-medium">Total</div>
                        <div className="text-lg font-bold text-blue-700">{filteredProducts.length}</div>
                      </div>
                      <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2.5 rounded-lg border border-orange-100">
                        <div className="text-xs text-orange-600 font-medium">Low Stock</div>
                        <div className="text-lg font-bold text-orange-700">
                          {filteredProducts.filter((p) => p.stock <= p.low_stock_alert_threshold).length}
                        </div>
                      </div>
                      <button
                        className="bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                        onClick={() => router.push('/admin/product/add')}
                      >
                        + Add Product
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <div className="text-5xl mb-4">📦</div>
                      <div className="text-lg font-medium mb-2 text-gray-700">No products found</div>
                      <div className="text-sm text-gray-500">Try adjusting your search terms or add a new product</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="max-h-[520px] overflow-y-auto pr-2 space-y-3">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md hover:scale-[1.01] transition-all duration-200 border border-gray-100"
                          >
                            <div className="flex items-center gap-5 min-w-0 flex-1">
                              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
                                {product.image_url ? (
                                  <img
                                    src={
                                      product.image_url.startsWith('http')
                                        ? product.image_url
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${product.image_url}`
                                    }
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-base text-gray-900 truncate">{product.name}</h3>
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full font-medium">
                                    SKU: {product.sku}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium border border-green-200">
                                    {product.category_name ?? 'Uncategorized'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Stock:</span>
                                    <span className={`font-semibold ${product.stock <= product.low_stock_alert_threshold ? 'text-red-600' : 'text-gray-900'}`}>
                                      {product.stock}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Price:</span>
                                    <span className="font-semibold text-gray-900">${formatPrice(product.price)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-gray-500">Cost:</span>
                                    <span className="font-semibold text-gray-900">${formatPrice(product.cost_price)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                              <div className="text-right">
                                <span
                                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                    product.status && product.stock > 0 
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                      : 'bg-red-100 text-red-700 border border-red-200'
                                  }`}
                                >
                                  {product.status && product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                                {product.stock <= product.low_stock_alert_threshold && product.stock > 0 && (
                                  <div className="text-xs text-orange-600 font-medium mt-1.5">⚠ Low Stock</div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Edit Product"
                                  onClick={() => router.push(`/admin/product/edit/${product.id}`)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>

                                <button
                                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  onClick={() => handleDelete(product.id)}
                                  title="Delete Product"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Sidebar with Low Stock alerts and supplier orders */}
            <aside className="w-full lg:w-80 space-y-6">
              {/* Low Stock Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Low Stock Alerts</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                  {filteredProducts.filter((p) => p.stock <= p.low_stock_alert_threshold).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-700">All products well stocked</p>
                      <p className="text-xs text-gray-500 mt-1">No low stock alerts</p>
                    </div>
                  ) : (
                    filteredProducts.filter((p) => p.stock <= p.low_stock_alert_threshold).slice(0, 6).map((product) => (
                      <div key={product.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors duration-150">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 flex-shrink-0">
                              {product.image_url ? (
                                <img
                                  src={
                                    product.image_url.startsWith('http')
                                      ? product.image_url
                                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${product.image_url}`
                                  }
                                  alt={product.name}
                                  className="w-10 h-10 rounded-md object-cover border border-orange-200"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-orange-200 rounded-md flex items-center justify-center">
                                  <span className="text-lg">⚠️</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                              <p className="text-xs text-gray-600 mt-0.5">SKU: {product.sku}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{product.category_name}</p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-3 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold text-orange-700 bg-orange-200">
                              {product.stock}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">left</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Supplier Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Supplier Orders</h3>
                  </div>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto space-y-3">
                  {supplierOrdersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-3">Loading orders...</p>
                    </div>
                  ) : supplierOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-sm font-medium">No supplier orders</p>
                    </div>
                  ) : (
                    supplierOrders.slice(0, 6).map((so: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="text-sm font-medium text-gray-800 truncate flex-1">
                          {so.reference ?? `Order #${so.id ?? idx}`}
                        </div>
                        <div className="ml-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {so.status ?? 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  {supplierOrdersError && (
                    <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                      {supplierOrdersError}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;