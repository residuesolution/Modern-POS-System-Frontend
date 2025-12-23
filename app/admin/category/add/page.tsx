'use client';

import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import ProfileHeader from '@/components/ProfileHeader';
import { fetchCurrentUser } from '@/services/authService';

interface User {
  name: string;
  role: string;
  profilePhoto?: string;
  [key: string]: any;
}

interface CategoryForm {
  category_name: string;
  description: string;
}

export default function AddCategoryPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CategoryForm>({
    category_name: '',
    description: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const userData = await fetchCurrentUser();
        const currentUser =
          (userData as any)?.user ||
          (userData as any)?.data ||
          userData ||
          null;

        if (!currentUser || !['ADMIN', 'MANAGER'].includes(currentUser.role)) {
          router.replace('/unauthorized');
          return;
        }

        setUser(currentUser);
      } catch {
        router.replace('/auth/login');
      } finally {
        setPageLoading(false);
      }
    })();
  }, [router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.category_name.trim()) {
      setError('Category name is required');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('User not authenticated');

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

      const res = await fetch(`${apiUrl}/api/category/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category_name: formData.category_name.trim(),
          description: formData.description.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to add category');
      }

      setSuccess('✅ Category added successfully!');
      setTimeout(() => router.push('/admin/product/view'), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-blue-600 text-lg font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-to-br from-50 via-50/30 to-gray-50">
      <main className="flex-1 p-8">
        <div className="transform transition-all duration-300 hover:scale-[1.01]">
          <ProfileHeader
            name={user.name}
            role={user.role}
            profilePhoto={user.profilePhoto}
          />
        </div>

        <div className="bg-white shadow-2xl rounded-3xl p-10 mt-10 max-w-2xl mx-auto border border-gray-100 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>
          
          <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Add New Category
          </h1>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-sm animate-slideIn">
              <div className="flex items-center">
                <span className="text-xl mr-2">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-6 shadow-sm animate-slideIn">
              <div className="flex items-center">
                <span className="text-xl mr-2">✅</span>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold mb-2 text-gray-700 transition-colors group-focus-within:text-blue-600">
                Category Name
              </label>
              <input
                type="text"
                name="category_name"
                value={formData.category_name}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:border-gray-300"
                placeholder="Enter category name"
              />
            </div>

            <div className="group">
              <label className="block text-sm font-semibold mb-2 text-gray-700 transition-colors group-focus-within:text-blue-600">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 resize-none shadow-sm hover:border-gray-300"
                placeholder="Enter category description"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3.5 rounded-xl text-white font-semibold shadow-lg transform transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed scale-95'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:scale-[1.02] active:scale-95'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  '💾 Save Category'
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/admin/product/view')}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-95"
              >
                🚫 Cancel
              </button>
            </div>
          </form>
        </div>
      </main>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}