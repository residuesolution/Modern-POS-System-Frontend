'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Notification {
  id: string;
  type: 'LOW_STOCK';
  message: string;
  read: boolean;
  createdAt: string;
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  alertThreshold: number;
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchLowStockNotifications = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        const res = await fetch(`${apiUrl}/api/product`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await res.json();
        const products = Array.isArray(data)
          ? data
          : data?.data || data?.items || [];

        const lowStockNotifications: Notification[] = products
          .filter(
            (p: any) =>
              Number(p.stock) <= Number(p.low_stock_alert_threshold)
          )
          .map((p: any) => ({
            id: `low-stock-${p.id}`,
            type: 'LOW_STOCK',
            message: `Low stock alert for "${p.name}"`,
            read: false,
            createdAt: new Date().toISOString(),
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            currentStock: p.stock,
            alertThreshold: p.low_stock_alert_threshold,
          }));

        setNotifications(lowStockNotifications);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load notifications');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockNotifications();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar active="notifications" />
      <main className="flex-1 p-8 bg-blue-100">
        <div className="max-w-4xl mx-auto mt-10">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <div className="flex space-x-4">
                  <div className="bg-orange-50 px-4 py-2 rounded-lg">
                    <div className="text-sm font-semibold text-orange-700">{notifications.length}</div>
                    <div className="text-xs text-orange-600">Low Stock Alerts</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-blue-600 text-sm mt-3">Loading notifications...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {!loading && notifications.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="text-lg font-medium text-gray-900 mb-2">All Clear!</div>
                  <div className="text-sm text-gray-500">No low stock alerts at the moment</div>
                </div>
              )}

              {!loading && notifications.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-4 rounded-xl transition-all border-2 bg-orange-50 border-orange-300 hover:bg-orange-100"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            ⚠️
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{n.productName}</h3>
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-medium">
                              SKU: {n.sku}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>
                              Current Stock: <span className="font-bold text-orange-600 text-lg">{n.currentStock}</span>
                            </span>
                            <span className="text-gray-400">|</span>
                            <span>
                              Alert Threshold: <span className="font-medium text-gray-900">{n.alertThreshold}</span>
                            </span>
                          </div>
                          <div className="mt-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded inline-block">
                            🔔 LOW STOCK ALERT - Only {n.currentStock} units left!
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/product/view`)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>View Product</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && notifications.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                  
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}