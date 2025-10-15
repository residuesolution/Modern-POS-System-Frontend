
"use client";
import React, { useEffect, useState } from "react";
//import AdminSidebar from "@/components/AdminSidebar";
import Sidebar from "@/components/Sidebar"; // 
import TopNavBar from "@/components/TopNavBar"; // 
import { fetchCurrentUser } from "@/services/authService";

interface Customer {
  customer_id: number;
  phone: string;
  name?: string;
  email?: string;
  loyalty_points: number;
  total_purchase?: number;
  last_purchase?: string;
  status?: string;
}

const CustomerListPage = () => {
  const [user, setUser] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filter customers based on search and status
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (customer.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      customer.customer_id.toString().includes(searchTerm); // <-- allow search by ID
    
    const matchesStatus = filterStatus === "all" || customer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Get loyalty status based on points
  const getLoyaltyStatus = (points: number) => {
    if (points >= 10000) return { status: "Platinum", color: "#3b82f6", bg: "#dbeafe" };
    if (points >= 5000) return { status: "Gold", color: "#1d4ed8", bg: "#bfdbfe" };
    if (points >= 1000) return { status: "Silver", color: "#1e40af", bg: "#e0e7ff" };
    return { status: "Regular", color: "#3730a3", bg: "#f0f9ff" };
  };

  useEffect(() => {
    async function getUserAndCustomers() {
      try {
        const userData = await fetchCurrentUser();
        const currentUser =
          userData && typeof userData === "object" && "user" in userData && userData.user
            ? userData.user
            : userData && typeof userData === "object" && "data" in userData && userData.data
            ? userData.data
            : userData;
        setUser(currentUser);
        if (
          !currentUser ||
          typeof currentUser !== "object" ||
          currentUser === null ||
          !("role" in currentUser) ||
          !["ADMIN", "MANAGER", "CASHIER"].includes((currentUser as any).role)
        ) {
          setError("Unauthorized");
          setLoading(false);
          return;
        }
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        // Fetch customers
        const res = await fetch(`${apiUrl}/api/customer/all`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        let customerData: Customer[] = [];
        if (!res.ok) {
          throw new Error(`Failed to fetch customers: ${res.status}`);
        }
        if (res.status === 204) {
          customerData = [];
        } else {
          customerData = await res.json();
        }
        // Fetch orders
        const orderRes = await fetch(`${apiUrl}/api/orders`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        let orders: any[] = [];
        if (orderRes.ok) {
          orders = await orderRes.json();
        }
        // Use backend total_purchase directly
        const enhancedData = customerData.map((customer: Customer) => {
          let total_purchase = customer.total_purchase ?? 0;
          let last_purchase = customer.last_purchase ?? "-";
          return {
            ...customer,
            name: customer.name || `Customer ${customer.customer_id}`,
            email: customer.email || `customer${customer.customer_id}@email.com`,
            total_purchase,
            last_purchase,
            status: customer.loyalty_points >= 1000 ? "active" : "regular"
          };
        });
        setCustomers(enhancedData);
      } catch (err: any) {
        setError(err.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    getUserAndCustomers();
  }, []);

  if (loading) return <div className="text-blue-700 text-center py-8">Loading...</div>;
  if (error) return <div className="text-red-700 text-center py-8">{error}</div>;

  return (
  <div className="flex max-h-screen bg-gray-150">
      <Sidebar active="customer-view" />
      <div className="flex-1 flex flex-col">
        <TopNavBar
  user={user || { name: "Admin", role: "ADMIN" }}
  onSearch={setSearchTerm} // <-- Pass search handler
 
/>

       <main className="flex-1 ml">
          <div className="p-8">
            <div className="flex space-x-8">
              {/* Left Column - Customer List */}
              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Customer Lists & Details</h2>
                      </div>
                    
                    {/* Stats Overview */}
                    <div className="flex space-x-4">
                      <div className="bg-blue-50 px-4 py-2 rounded-lg">
                        <div className="text-sm font-semibold text-blue-700">{filteredCustomers.length}</div>
                        <div className="text-xs text-blue-600">Total Customers</div>
                      </div>
                      <div className="bg-blue-50 px-4 py-2 rounded-lg">
                        <div className="text-sm font-semibold text-blue-700">
                          {Math.round(filteredCustomers.reduce((sum, c) => sum + c.loyalty_points, 0) / filteredCustomers.length) || 0}
                        </div>
                        <div className="text-xs text-blue-600">Avg. Points</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer List */}
                <div className="p-6">
                  {filteredCustomers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-4xl mb-4">🔍</div>
                      <div className="text-lg font-medium mb-2">No customers found</div>
                      <div className="text-sm">Try adjusting your search terms or filters</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredCustomers.map((customer) => {
                        const loyaltyInfo = getLoyaltyStatus(customer.loyalty_points);
                        return (
                          <div 
                            key={customer.customer_id} 
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              {/* Customer Avatar */}
                              <div className="flex-shrink-0">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                                  style={{ backgroundColor: loyaltyInfo.color }}
                                >
                                  {(customer.name || 'C').charAt(0).toUpperCase()}
                                </div>
                              </div>

                              {/* Customer Details */}
                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                    #{customer.customer_id.toString().padStart(6, '0')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-1">📞 {customer.phone}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>Purchase: <span className="font-medium text-gray-900">Rs. {customer.total_purchase?.toLocaleString()}</span></span>
                                  <span>Last: <span className="font-medium text-gray-900">{customer.last_purchase}</span></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-6">
                              {/* Loyalty Status */}
                              <div className="text-center">
                                <div 
                                  className="px-3 py-1 rounded-full text-xs font-medium mb-1"
                                  style={{ backgroundColor: loyaltyInfo.bg, color: loyaltyInfo.color }}
                                >
                                  {loyaltyInfo.status}
                                </div>
                                <div className="text-xs text-gray-500">{customer.loyalty_points} points</div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                                  Send Offers
                                </button>
                                {/* <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button> */}
                                {/* <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </button> */}
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

            {/* Right Column - Customer Analytics */}
            <div className="w-80 space-y-6">
              {/* Top Customers */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Top Customers</h3>
                </div>
                <div className="p-4 space-y-3">
                  {filteredCustomers.slice(0, 4).map((customer) => (
                    <div key={customer.customer_id} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {(customer.name || 'C').charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.loyalty_points} pts</div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">Rs. {customer.total_purchase?.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty Programs */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Loyalty Programs</h3>
                </div>
                <div className="p-4 space-y-3">
                  {["Platinum", "Gold", "Silver", "Regular"].map((tier, index) => {
                    const count = filteredCustomers.filter(c => getLoyaltyStatus(c.loyalty_points).status === tier).length;
                    return (
                      <div key={tier} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-blue-400' : 'bg-blue-300'}`}></div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{tier}</div>
                            <div className="text-xs text-gray-500">Members</div>
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">{count}</div>
                      </div>
                    );
                  })}
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

export default CustomerListPage;