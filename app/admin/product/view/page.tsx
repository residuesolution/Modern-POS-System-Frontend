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
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Search now checks category_name as well
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (product.name || "").toLowerCase().includes(term) ||
      (product.sku || "").toLowerCase().includes(term) ||
      (product.category_name || String(product.category_id || "")).toLowerCase().includes(term) ||
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
        if (
          !currentUser ||
          !['ADMIN', 'MANAGER', 'CASHIER'].includes(currentUser.role)
        ) {
          router.replace('/unauthorized');
          return;
        }
        setUser(currentUser);

        // auth token
        let authToken = token;
        if (!authToken) {
          authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          setToken(authToken);
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

        // Fetch categories first
        let catMap: Record<number, string> = {};
        try {
          const cRes = await fetch(`${apiUrl}/api/category`, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          });
          if (cRes.ok) {
            const cData = await cRes.json();
            const cats = Array.isArray(cData) ? cData : cData?.data || cData?.items || [];
            (cats || []).forEach((c: any) => {
              const id = Number(c.category_id ?? c.id ?? c.categoryId ?? c._id);
              const name = c.category_name ?? c.name ?? c.title ?? c.label;
              if (!Number.isNaN(id) && name) catMap[id] = String(name).trim();
            });
          }
        } catch (e) {
          console.error('Failed to fetch categories:', e);
        }
        setCategoriesMap(catMap);

        // Fetch products
        const res = await fetch(`${apiUrl}/api/product`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        const rawProducts = Array.isArray(data) ? data : data?.data || data?.items || [];

        // Map products to include category_name (fallback to id)
        const mapped: Product[] = (rawProducts || []).map((p: any) => {
          const idVal = p.id ?? p.productId ?? p.sku;
          const catId = p.category_id ?? p.categoryId ?? p.category ?? null;
          const cid = (typeof catId === "string" && /^\d+$/.test(catId)) ? Number(catId) : (typeof catId === "number" ? catId : null);
          return {
            id: typeof idVal === "number" ? idVal : Number(idVal) || Math.floor(Math.random() * 1e9),
            name: p.name ?? p.productName ?? 'Unnamed',
            category_id: cid ?? (p.category_id ? Number(p.category_id) : 0),
            category_name: cid && catMap[cid] ? catMap[cid] : (p.categoryName ?? p.category ?? (cid ? String(cid) : "Uncategorized")),
            sku: p.sku ?? p.code ?? '',
            price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
            cost_price: typeof p.cost_price === "number" ? p.cost_price : Number(p.cost_price) || 0,
            stock: typeof p.stock === "number" ? p.stock : Number(p.stock) || 0,
            low_stock_alert_threshold: typeof p.low_stock_alert_threshold === "number" ? p.low_stock_alert_threshold : Number(p.low_stock_alert_threshold) || 0,
            status: Boolean(p.status ?? p.active ?? true),
          } as Product;
        });

        setProducts(dedupeById(mapped));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    getUserAndProducts();

    // Fetch supplier orders
    async function fetchSupplierOrders() {
      setSupplierOrdersLoading(true);
      setSupplierOrdersError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const res = await fetch(`${apiUrl}/api/supplier-order`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch supplier orders: ${res.status} ${txt}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
        setSupplierOrders(list);
      } catch (error) {
        setSupplierOrdersError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setSupplierOrdersLoading(false);
      }
    }
    fetchSupplierOrders();
  }, [router, token]);

  // Delete product handler
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
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to delete product: ${res.status} ${txt}`);
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-blue-700 text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-700 text-center py-8">{error}</div>;

  return (
    <div className="flex max-h-screen bg-gray-150">
      <div className="flex-1 flex flex-col">
        <TopNavBar
          user={user || { name: "Admin", role: "ADMIN" }}
          onSearch={setSearchTerm}
        />
        <main className="flex-1 ml">
          <div className="p-8 mt-10">
            <div className="flex space-x-8">
              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Product List & Stock</h2>
                      </div>
                      <div className="flex space-x-4">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                          <div className="text-sm font-semibold text-blue-700">{filteredProducts.length}</div>
                          <div className="text-xs text-blue-600">Total Products</div>
                        </div>
                        <div className="bg-red-50 px-4 py-2 rounded-lg">
                          <div className="text-sm font-semibold text-red-700">
                            {filteredProducts.filter(p => p.stock <= p.low_stock_alert_threshold).length}
                          </div>
                          <div className="text-xs text-red-600">Low Stock</div>
                        </div>
                        <button
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          onClick={() => router.push('/admin/product/add')}
                        >
                          Add Product
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">📦</div>
                        <div className="text-lg font-medium mb-2">No products found</div>
                        <div className="text-sm">Try adjusting your search terms</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="max-h-80 overflow-y-auto">
                          {filteredProducts.map((product) => {
                            const ordersForProduct = supplierOrders.filter(o => (o.productId ?? o.product_id) == product.id);
                            const isLowStock = product.stock <= product.low_stock_alert_threshold;
                            return (
                              <div 
                                key={product.id} 
                                className={`flex items-center justify-between p-4 rounded-xl transition-all border-2 ${
                                  isLowStock 
                                    ? 'bg-orange-50 border-orange-300 hover:bg-orange-100' 
                                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  {isLowStock && (
                                    <div className="flex-shrink-0">
                                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                        ⚠️
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                        SKU: {product.sku}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span>Stock: <span className={`font-bold ${isLowStock ? 'text-orange-600 text-lg' : 'text-gray-900'}`}>{product.stock}</span></span>
                                      <span>Price: <span className="font-medium text-gray-900">${formatPrice(product.price)}</span></span>
                                      <span>Cost: <span className="font-medium text-gray-900">${formatPrice(product.cost_price)}</span></span>
                                      <span>Category: <span className="font-medium text-gray-900">{product.category_name ?? product.category_id}</span></span>
                                    </div>

                                    {isLowStock && (
                                      <div className="mt-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded inline-block">
                                        🔔 LOW STOCK ALERT - Only {product.stock} units left!
                                      </div>
                                    )}

                                    {/* show recent orders for this product */}
                                    {ordersForProduct.length > 0 && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        <div className="font-medium text-sm">Supplier orders:</div>
                                        {ordersForProduct.slice(0,3).map((o, i) => (
                                          <div key={i} className="text-xs">
                                            {(o.supplierName || o.supplier || 'Unknown')} — {o.quantity || 0} — {(o.expectedDelivery || o.expected_date || o.deliveryDate || '').slice(0,10) || 'TBD'}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      product.status && product.stock > 0
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {product.status && product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <button
                                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Edit Product"
                                      onClick={() => router.push(`/admin/product/edit/${product.id}`)}
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center flex gap-3 justify-center">
                      <button
                        className="bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
                        onClick={() => router.push('/admin/order/add')}
                      >
                        <span>📦</span>
                        <span>Order Stock</span>
                      </button>
                      <button
                        className="bg-green-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors inline-flex items-center space-x-2"
                        onClick={() => router.push('/admin/category/add')}
                      >
                        <span>📂</span>
                        <span>Add Category</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-80 space-y-6" style={{ width: 'calc(30vw - 124px)' }}>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Restock & Supplier Orders</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {supplierOrdersLoading ? (
                      <div className="text-center py-8 text-blue-600 text-sm">Loading supplier orders...</div>
                    ) : supplierOrdersError ? (
                      <div className="text-center py-8 text-red-600 text-sm">{supplierOrdersError}</div>
                    ) : supplierOrders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">No supplier orders found</div>
                    ) : (
                      supplierOrders.map((order, index) => {
                        const isDelivered = order.status?.toLowerCase().includes('delivered');
                        return (
                          <div 
                            key={order.orderId || order.id || index} 
                            className={`border rounded-2xl p-4 transition-all hover:shadow-md w-full max-w-3xl mx-auto ${
                              isDelivered ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">Supplier</div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {order.supplierName || order.supplier || 'Unknown Supplier'}
                                </div>
                              </div>
                              <div className="flex justify-between items-start">
                                <div className="text-xs text-gray-500">Product</div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-800">
                                    ID: {order.productId || order.product_id || 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {order.productName || order.name || order.product_name || 'No product name'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">Items ordered</div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {order.quantity}
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">Expected Delivery</div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {order.expectedDelivery || order.deliveryDate || order.expected_date || 'TBD'}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {supplierOrders.length > 0 && (
                      <div className="pt-4 border-t border-gray-200">
                        <button 
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          onClick={() => router.push('/admin/order/view')}
                        >
                          View All Orders
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
                  </div>
                  <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                    {filteredProducts.filter(p => p.stock <= p.low_stock_alert_threshold).length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        ✅ All products are well stocked
                      </div>
                    ) : (
                      filteredProducts.filter(p => p.stock <= p.low_stock_alert_threshold).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-orange-50 border-l-4 border-orange-500 rounded-lg hover:bg-orange-100 transition">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                              ⚠️
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{product.name}</div>
                              <div className="text-xs text-gray-600">SKU: {product.sku}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">{product.stock}</div>
                            <div className="text-xs text-orange-500">remaining</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductListPage;