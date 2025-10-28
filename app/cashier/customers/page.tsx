'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCurrentUser } from '@/services/authService';
import TopNavBar from '@/components/TopNavBar';
import Sidebar from "@/components/CashierSidebar";

type CustomerApi = {
  id?: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  loyaltyPoints?: number | null;
  createdAt?: string | null;
  totalPurchase?: number | string | null;
  lastPurchase?: string | null;
};

interface User {
  role: string;
  name?: string;
  profilePhoto?: string;
  [key: string]: any;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUserAndCustomers();
  }, []);

  const normalize = (payload: any): any[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.data) {
      if (Array.isArray(payload.data)) return payload.data;
      if (payload.data.content && Array.isArray(payload.data.content)) return payload.data.content;
    }
    if (payload.content && Array.isArray(payload.content)) return payload.content;
    if (payload.items && Array.isArray(payload.items)) return payload.items;
    for (const k of Object.keys(payload)) {
      if (Array.isArray(payload[k])) return payload[k];
    }
    if (typeof payload === 'object') return [payload];
    return [];
  };

  const getUserAndCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await fetchCurrentUser();
      const currentUser =
        userData && typeof userData === 'object' && 'user' in userData && userData.user
          ? userData.user as User
          : userData && typeof userData === 'object' && 'data' in userData && userData.data
          ? userData.data as User
          : userData as User;
      
      if (!currentUser || !['ADMIN', 'MANAGER', 'CASHIER'].includes(currentUser.role)) {
        router.replace('/unauthorized');
        return;
      }

      setUser(currentUser);

      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${apiUrl}/api/customers`, { headers });
      const json = await res.json().catch(() => null);
      let list = normalize(json);

      const enriched = await Promise.all(
        list.map(async (c: any) => {
          const id = c?.id;
          if (!id) return c;
          try {
            const sRes = await fetch(`${apiUrl}/api/customers/${id}/summary`, { headers });
            if (!sRes.ok) return c;
            const sJson = await sRes.json().catch(() => null);
            const data = sJson?.data ?? sJson;
            return { ...c, totalPurchase: data?.totalPurchase ?? null, lastPurchase: data?.lastPurchase ?? null };
          } catch {
            return c;
          }
        })
      );

      setCustomers(Array.isArray(enriched) ? enriched : []);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err?.message ?? 'Failed to fetch customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const safe = (v: any) => (v === null || v === undefined ? '' : String(v));
  const q = (searchTerm ?? '').trim().toLowerCase();

  const filteredCustomers = Array.isArray(customers)
    ? customers.filter((customer) => {
        const name = safe(customer.name).toLowerCase();
        const email = safe(customer.email).toLowerCase();
        const phone = safe(customer.phone).toLowerCase();
        const id = safe(customer.id).toLowerCase();
        if (!q) return true;
        return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
      })
    : [];

  const getCustomerStatus = (points?: number | null) => {
    const p = Number(points ?? 0);
    if (p >= 5000) return { label: 'Platinum member', bg: '#f3e8ff', color: '#7c3aed' };
    if (p >= 1000) return { label: 'Gold member', bg: '#fef3c7', color: '#d97706' };
    if (p >= 100) return { label: 'Silver member', bg: '#f3f4f6', color: '#374151' };
    return { label: 'Regular member', bg: '#f3f4f6', color: '#4b5563' };
  };

  const formatTotal = (v: any) => {
    if (!v) return '0';
    const num = typeof v === 'string' ? Number(v) : Number(v);
    if (Number.isNaN(num)) return String(v);
    return num.toLocaleString();
  };

  const formatDate = (d?: string | null) => {
    if (!d) return 'N/A';
    const asDate = new Date(d);
    if (!isNaN(asDate.getTime())) return asDate.toISOString().slice(0, 10);
    return String(d).slice(0, 10);
  };

  if (loading) return <div className="text-blue-700 text-center py-8">Loading customers...</div>;
  if (error) return <div className="text-red-700 text-center py-8">{error}</div>;

  return (
    <div className="flex bg-blue-400 min-h-screen">
      <Sidebar active="customers" />
      <div className="flex-1 flex flex-col items-center">
        <TopNavBar user={user || { name: "Cashier", role: "Cashier" }} onSearch={setSearchTerm} />
        <main className="flex-1 w-full flex justify-center items-start pt-20">
          <div className="w-full max-w-6xl p-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Customer List</h2>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => router.push('/cashier/customers/add')}
              >
                Add Customer
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow overflow-auto">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">👥</div>
                  <div className="text-lg font-medium mb-2">No customers found</div>
                  <div className="text-sm">Try adjusting your search terms</div>
                </div>
              ) : (
                <div className="min-w-full">
                  {filteredCustomers.map((customer, idx) => {
                    const status = getCustomerStatus(customer.loyaltyPoints);
                    const totalStr = formatTotal(customer.totalPurchase ?? 0);
                    const lastStr = customer.lastPurchase ? formatDate(customer.lastPurchase) : formatDate(customer.createdAt);
                    const customerId = safe(customer.id);
                    const paddedId = customerId.padStart ? customerId.padStart(10, '0') : customerId;

                    return (
                      <div
                        key={customer.id ?? idx}
                        className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                            {(safe(customer.name) || 'U')[0].toUpperCase()}
                          </div>
                          <div className="grid grid-cols-5 gap-4 w-full">
                            <div>
                              <div className="font-medium text-gray-900">{safe(customer.name)}</div>
                              <div className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">#{paddedId}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Phone</div>
                              <div className="text-sm text-blue-600">{safe(customer.phone)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Email</div>
                              <div className="text-sm text-gray-900 truncate">{safe(customer.email)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Total Purchase</div>
                              <div className="text-sm text-gray-900">Rs. {totalStr}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Last Purchase</div>
                              <div className="text-sm text-gray-900">{lastStr}</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span
                            style={{
                              backgroundColor: status.bg,
                              color: status.color,
                              padding: '4px 12px',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
