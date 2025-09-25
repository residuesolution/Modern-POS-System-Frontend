import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: {
    name?: string;
    role?: string;
    profilePhoto?: string;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  active: "product" | "customer" | "admin" | "report";
}

const Header: React.FC<HeaderProps> = ({ user, searchTerm, setSearchTerm, active }) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getSearchPlaceholder = () => {
    switch (active) {
      case "product":
        return "Search products, SKU, or try 'low stock', 'in stock', 'out of stock'...";
      case "customer":
        return "Search customers by name, phone, or ID...";
      case "report":
        return "Search reports, products, customers...";
      default:
        return "Search...";
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "text-blue-600 bg-blue-50";
      case "MANAGER":
        return "text-emerald-600 bg-emerald-50";
      case "CASHIER":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 w-full">
      <div className="px-5 py-4 w-full">
        <div className="flex items-center justify-between" style={{ width: 'calc(85vw - 124px)' }}>
          <div className="flex-1 max-w-3xl mr-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg 
                  className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 focus:bg-white transition-all duration-200 hover:border-gray-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Actions & Profile */}
          <div className="flex items-center space-x-6">
            {/* Action Buttons */}
            {(active === "product" || active === "report" || active === "customer") && (
              <div className="flex items-center space-x-4">
                <button
                  className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => alert("Scan Barcode feature coming soon!")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Scan Barcode</span>
                </button>

                <button 
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-200 border border-gray-200 hover:border-blue-200"
                  onClick={() => router.push('/admin/billing')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create Bill</span>
                </button>
              </div>
            )}

            {/* Notifications */}
            <button className="relative p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5.586-5.586a1 1 0 010-1.414L20 4h-5.586a1 1 0 01-.707-.293L12 2l-1.707 1.707A1 1 0 019.586 4H4l5.586 5.586a1 1 0 010 1.414L4 17h5.586a1 1 0 01.707.293L12 19l1.707-1.707A1 1 0 0114.414 17z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-2xl px-5 py-3 transition-all duration-200 border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-800 leading-tight">
                    {user?.name || "User"}
                  </div>
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${getRoleColor(user?.role)}`}>
                    {user?.role || "ROLE"}
                  </div>
                </div>
                <div className="relative">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                    {user?.profilePhoto ? (
                      <img 
                        src={user.profilePhoto} 
                        alt={user.name || "User"} 
                        className="w-11 h-11 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500">{user?.role || "Role"}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    Preferences
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;