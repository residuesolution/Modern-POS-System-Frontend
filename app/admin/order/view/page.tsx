
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { fetchCurrentUser } from '@/services/authService';

interface SupplierOrder {
  orderId?: number;
  id?: number;
  supplierName?: string;
  supplier?: string;
  productId?: number;
  product_id?: number;
  productName?: string;
  name?: string;
  product_name?: string;
  quantity?: number;
  expectedDelivery?: string;
  deliveryDate?: string;
  expected_date?: string;
  status?: string;
}

interface User {
  role: string;
  name?: string;
  profilePhoto?: string;
  [key: string]: any;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [listMaxHeight, setListMaxHeight] = useState<number | null>(null);
  const router = useRouter();
  const firstCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function getUserAndOrders() {
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

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const res = await fetch(`${apiUrl}/api/supplier-order`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch orders: ${res.status} ${txt}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
        setOrders(list);
      } catch (error) {
        setOrdersError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setOrdersLoading(false);
      }
    }
    getUserAndOrders();
  }, [router]);

  // After orders render, measure first card height and set max height = 2 * cardHeight + gap
  useEffect(() => {
    if (!firstCardRef.current) {
      setListMaxHeight(null);
      return;
    }
    // small delay to ensure layout settled
    const id = window.setTimeout(() => {
      const cardHeight = firstCardRef.current?.offsetHeight ?? 0;
      const gap = 16; // Tailwind space-y-4 = 1rem = 16px between items
      const max = cardHeight * 2 + gap;
      setListMaxHeight(max);
    }, 50);
    return () => window.clearTimeout(id);
  }, [orders]);

  // Filter orders based on search
  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (order.supplierName || order.supplier || '').toLowerCase().includes(term) ||
      (order.productName || order.name || order.product_name || '').toLowerCase().includes(term) ||
      String(order.productId || order.product_id || '').includes(term) ||
      String(order.orderId || order.id || '').includes(term)
    );
  });

  if (ordersLoading) return <div className="text-blue-700 text-center py-8">Loading...</div>;
  if (ordersError) return <div className="text-red-700 text-center py-8">{ordersError}</div>;

  return (
    <div className="flex max-h-screen bg-gray-150">
      <Sidebar active="orders-view" />
      <div className="flex-1 flex flex-col">
        
        <main className="flex-1 ml">
          <div className="p-8">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-200 h-130">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">All Supplier Orders</h2>
                </div>
                <div className="flex space-x-4">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <div className="text-sm font-semibold text-blue-700">{filteredOrders.length}</div>
                    <div className="text-xs text-blue-600">Total Orders</div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">📦</div>
                    <div className="text-lg font-medium mb-2">No orders found</div>
                    <div className="text-sm">Try adjusting your search terms</div>
                  </div>
                ) : (
                  // container becomes scrollable once its content exceeds 2 cards
                  <div
                    className="space-y-4"
                    style={{
                      maxHeight: listMaxHeight ? `${listMaxHeight}px` : undefined,
                      overflowY: listMaxHeight ? 'auto' : undefined,
                    }}
                  >
                    {filteredOrders.map((order, index) => {
                      const isDelivered = order.status?.toLowerCase().includes('delivered');
                      return (
                        <div
                          ref={index === 0 ? firstCardRef : undefined}
                          key={order.orderId || order.id || index}
                          className={`border rounded-2xl p-4 transition-all hover:shadow-md w-full max-w-3xl mx-auto ${
                            isDelivered ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-semibold text-gray-600">Order</div>
                              <div className="text-sm font-bold text-blue-600">
                                #{order.orderId || order.id || `ORD${2450 + index + 1}`}
                              </div>
                            </div>
                          </div>
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
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrdersPage;
