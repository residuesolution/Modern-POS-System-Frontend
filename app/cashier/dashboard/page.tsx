// ...existing code...
"use client";

import React from "react";
import Link from "next/link";


export default function CashierDashboardPage() {
  const userRaw =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const user = userRaw ? JSON.parse(userRaw) : null;

  return (
    <div className="min-h-screen flex bg-gray-50">
{/*       <aside className="w-64 border-r bg-white">
        <CashierSidebar active="" />
      </aside> */}

      <main className="flex-1 p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Cashier Dashboard</h1>
          {user && (
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {user.name ?? user.username ?? "Cashier"}.
            </p>
          )}
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
         

          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-sm font-medium text-gray-700">Customers</h2>
            <p className="text-xs text-gray-500 mt-2">
              View and search customers.
            </p>
            <Link
              href="/cashier/customers"
              className="inline-block mt-3 text-xs text-blue-600 hover:underline"
            >
              Manage Customers
            </Link>
          </div>

          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-sm font-medium text-gray-700">Today's Sales</h2>
            <p className="text-xs text-gray-500 mt-2">
              Summary and quick metrics (placeholder).
            </p>
            <Link
              href="/cashier/dashboard"
              className="inline-block mt-3 text-xs text-blue-600 hover:underline"
            >
              View Reports
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-sm font-medium text-gray-700">
              Recent Transactions
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Placeholder for recent sales list or recent bills created by the
              cashier.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
// ...existing code...