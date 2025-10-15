'use client';
import React, { useEffect, useState } from 'react';
import { fetchCurrentUser } from '@/services/authService';
import { useRouter } from 'next/navigation';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from "@/components/Sidebar"; // 

interface Product {
  id: number;
  name: string;
  category_id: number;
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

const ProductListPage = () => {
  // Supplier orders state
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

  // Filter products based on search
  // const filteredProducts = products.filter((product) => {
  //   const term = searchTerm.toLowerCase().trim();

  //   // 1. Match product name or SKU
  //   const matchesNameOrSku =
  //     product.name.toLowerCase().includes(term) ||
  //     product.sku.toLowerCase().includes(term);

  //   // 2. Match by stock status keywords
  //   const isLowStock = product.stock <= product.low_stock_alert_threshold && product.stock > 0;
  //   const isInStock = product.status && product.stock > 0;
  //   const isOutOfStock = product.stock <= 0 || !product.status;

  //   const matchesStockStatus =
  //     (term === "low stock" && isLowStock) ||
  //     (term === "in stock" && isInStock) ||
  //     (term === "out of stock" && isOutOfStock);

  //   // If no search term → return all products
  //   if (!term) return true;

  //   return matchesNameOrSku || matchesStockStatus;
  // });
  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      String(product.category_id).includes(term) ||
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
        // Retrieve token from localStorage or another source if not already set
        let authToken = token;
        if (!authToken) {
          authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          setToken(authToken);
        }
        // Use your backend API URL here, e.g., process.env.NEXT_PUBLIC_API_URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/product`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
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
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete product');
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
      <Sidebar active="product-view" />
      <div className="flex-1 flex flex-col">
       <TopNavBar
          user={user || { name: "Admin", role: "ADMIN" }}
          onSearch={setSearchTerm} // <-- Pass search handler
        />
        <main className="flex-1 ml">
          {/* Content Area */}
          <div className="p-8">
            <div className="flex space-x-8">
              {/* Left Column - Product List */}
              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Header */}
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
                      
                      {/* Stats Overview */}
                      <div className="flex space-x-4">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                          <div className="text-sm font-semibold text-blue-700">{filteredProducts.length}</div>
                          <div className="text-xs text-blue-600">Total Products</div>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                          <div className="text-sm font-semibold text-blue-700">
                            {filteredProducts.filter(p => p.stock <= p.low_stock_alert_threshold).length}
                          </div>
                          <div className="text-xs text-blue-600">Low Stock</div>
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

                  {/* Product List */}
                  <div className="p-6">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">📦</div>
                        <div className="text-lg font-medium mb-2">No products found</div>
                        <div className="text-sm">Try adjusting your search terms</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredProducts.map((product) => (
                          <div 
                            key={product.id} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                {product.image_url ? (
                                  <img
                                    src={
                                      product.image_url.startsWith('http')
                                        ? product.image_url
                                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${product.image_url}`
                                    }
                                    alt={product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                    SKU: {product.sku}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>Stock: <span className={`font-medium ${product.stock <= product.low_stock_alert_threshold ? 'text-red-600' : 'text-gray-900'}`}>{product.stock}</span></span>
                                  <span>Price: <span className="font-medium text-gray-900">${product.price.toFixed(2)}</span></span>
                                  <span>Cost: <span className="font-medium text-gray-900">${product.cost_price.toFixed(2)}</span></span>
                                  <span>Category: <span className="font-medium text-gray-900">{product.category_id}</span></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              {/* Status Badge */}
                              <div className="text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  product.status && product.stock > 0
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {product.status && product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                                {product.stock <= product.low_stock_alert_threshold && product.stock > 0 && (
                                  <div className="text-xs text-orange-600 mt-1">Low Stock Alert</div>
                                )}
                              </div>

                              {/* Action Buttons */}
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
                                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Order Stock Button */}
                    <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                      <button
                        className="bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
                        onClick={() => router.push('/admin/order/add')}
                      >
                        <span>📦</span>
                        <span>Order Stock</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Analytics */}
              <div className="w-80 space-y-6" style={{ width: 'calc(30vw - 124px)' }}>
                {/* Restock & Supplier Orders */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Restock & Supplier Orders</h3>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                    </button>
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
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="text-sm font-semibold text-gray-600">Order </div>
                                {/* <div className="text-sm font-bold text-blue-600">
                                  #{order.orderId || order.id || `ORD${2450 + index + 1}`}
                                </div> */}
                              </div>
                            </div>

                            {/* Content Rows */}
                            <div className="space-y-2">

                              {/* Supplier Row */}
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">Supplier</div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {order.supplierName || order.supplier || 'Unknown Supplier'}
                                </div>
                              </div>

                              {/* Product Row - UPDATED: Product Name below Product ID */}
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

                              {/* Items Ordered Row */}
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-gray-500">Items ordered</div>
                                <div className="text-sm font-semibold text-gray-800">
                                  {order.quantity}
                                </div>
                              </div>

                              {/* Expected Delivery Row */}
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
                    
                    {/* View All Orders Button */}
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
                  <div className="p-4 space-y-3">
                    {filteredProducts.filter(p => p.stock <= p.low_stock_alert_threshold).slice(0, 4).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs">
                            ⚠️
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                          </div>
                        </div>
                        <div className="text-xs text-orange-600 font-medium">{product.stock} left</div>
                      </div>
                    ))}
                    {filteredProducts.filter(p => p.stock <= p.low_stock_alert_threshold).length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        All products are well stocked
                      </div>
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