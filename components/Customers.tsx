"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavBar from "./TopNavBar";
import { fetchCurrentUser } from "../services/authService";

export default function CustomersPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      try {
        const userData = await fetchCurrentUser();
        setUser(
          userData && typeof userData === "object" && "user" in userData && userData.user
            ? userData.user
            : userData && typeof userData === "object" && "data" in userData && userData.data
            ? userData.data
            : userData
        );
      } catch {
        setUser(null);
      }
    }
    getUser();
  }, []);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-blue-400 to-blue-700">
          {/* Sidebar with logo */}
          <Sidebar active="customers" />
    
          {/* Top Navigation Bar */}
          <div className="flex-1 flex flex-col" style={{marginLeft: 256}}>
            <TopNavBar user={user} />
            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 mt-16">
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Your Customers!
                </h1>
                <p className="text-gray-700 mb-6">
                  This is a sample customers page. You can customize it with your own content and features.
                </p>
              </div>
            </main>
          </div>
        </div>
  );
}