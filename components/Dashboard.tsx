"use client";
import AdminSidebar from "./AdminSidebar"; 

export default function Dashboard() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-blue-400 to-blue-700">
      {/* Sidebar */}
      <AdminSidebar active="dashboard" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 ml-64">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard!
          </h1>
          <p className="text-gray-700 mb-6">
            This is a sample dashboard page. You can customize it with your own content and features.
          </p>
        </div>
      </main>
    </div>
  );
}
