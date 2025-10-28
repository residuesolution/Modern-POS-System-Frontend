'use client';
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import Sidebar from "@/components/CashierSidebar";
import { fetchCurrentUser } from "@/services/authService";

type User = {
  name: string;
  role: string;
  profilePhoto?: string;
  [key: string]: any;
};

interface Customer {
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: string;
}

const AddCustomerPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    loyaltyPoints: "0",
  });
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
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
        currentUser === null ||
        !("role" in currentUser) ||
        !["ADMIN", "CASHIER"].includes((currentUser as User).role)
      ) {
        router.replace("/unauthorized");
      }
    }
    getUser();
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const response = await fetch(`${apiUrl}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          loyaltyPoints: parseInt(formData.loyaltyPoints || "0", 10),
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to add customer: ${response.status} ${errText}`);
      }

      setSuccess("Customer added successfully!");
      router.push("/cashier/customers");
    } catch (err: any) {
      setError(err?.message || "Failed to add customer.");
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="text-blue-700 text-center py-8">
        Loading...
      </div>
    );

  return (
    <div className="flex bg-blue-400 min-h-screen">
      <Sidebar active="customer-view" />
      <main className="flex-1 flex flex-col items-center w-full min-h-screen">
        <ProfileHeader name={user.name} role={user.role} profilePhoto={user.profilePhoto} />

        <div
          className="bg-white bg-opacity-95 mt-10 p-10 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/30 backdrop-blur-lg"
        >
          <div className="text-center mb-8 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Add New Customer
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Enter the customer details below
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm font-medium">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +1 234 567 890"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 focus:border-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                    Loyalty Points
                  </label>
                  <input
                    type="number"
                    name="loyaltyPoints"
                    min="0"
                    value={formData.loyaltyPoints}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 text-gray-800 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10 border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 text-white py-3 rounded-lg font-semibold uppercase tracking-wide transition-all shadow-md ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg"
                }`}
              >
                {loading ? "⏳ Adding..." : "💾 Save Customer"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/cashier/customers")}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-lg transition-all"
              >
                🚫 Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddCustomerPage;
