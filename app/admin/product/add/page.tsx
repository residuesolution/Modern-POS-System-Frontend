'use client';
import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import { fetchCurrentUser } from "@/services/authService";

type User = {
  name: string;
  role: string;
  profilePhoto?: string;
  [key: string]: any;
};

interface ProductForm {
  name: string;
  category_id: string;
  sku: string;
  price: string;
  cost_price: string;
  stock: string;
  low_stock_alert_threshold: string;
  image_url?: string;
  status: boolean;
  image_file?: File;
}

export default function AddProductPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([
    { id: "1", name: "Electronics" },
    { id: "2", name: "Clothing" },
    { id: "3", name: "Books" },
    { id: "4", name: "Food" },
  ]);

  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    category_id: "",
    sku: "",
    price: "",
    cost_price: "",
    stock: "",
    low_stock_alert_threshold: "",
    image_url: "",
    status: true,
    image_file: undefined,
  });

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
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
          (currentUser as User).role !== "ADMIN"
        ) {
          router.replace("/unauthorized");
        }
      } catch {
        router.replace("/unauthorized");
      }
    })();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        if (!apiUrl) return;
        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${apiUrl}/api/category`, { headers });
        if (!res.ok) return;
        const payload = await res.json().catch(() => null);
        const list: any[] = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
        if (!Array.isArray(list) || list.length === 0) return;
        const mapped = list.map((c: any) => {
          const id = c.id ?? c._id ?? c.value ?? c.category_id ?? c.categoryId;
          const name = c.name ?? c.title ?? c.category_name ?? c.label ?? String(c);
          return { id: String(id), name: String(name).trim() };
        });
        // merge unique by id or name
        const map = new Map<string, { id: string; name: string }>();
        [...mapped, ...categories].forEach((c) => {
          if (c && c.id && c.name) map.set(c.id, c);
        });
        setCategories(Array.from(map.values()));
      } catch {
        // ignore, keep fallback categories
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image_file: file,
        image_url: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("category_id", formData.category_id);
      formDataToSend.append("sku", formData.sku);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("cost_price", formData.cost_price);
      formDataToSend.append("stock", formData.stock);
      formDataToSend.append("low_stock_alert_threshold", formData.low_stock_alert_threshold);
      formDataToSend.append("status", formData.status ? "1" : "0");

      if (formData.image_file) {
        formDataToSend.append("image", formData.image_file);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const response = await fetch(`${apiUrl}/api/product/add`, {
        method: "POST",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined, // don't set Content-Type
        body: formDataToSend,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Failed to add product: ${response.status} ${errText}`);
      }

      const created = await response.json().catch(() => null);

      // notify other tabs/pages to refresh (Dashboard listens for this)
      try {
        localStorage.setItem(
          "product-added",
          JSON.stringify({ time: Date.now(), product: created?.data ?? created ?? null })
        );
      } catch {}

      setSuccess("Product added successfully!");
      // small delay to show success then navigate
      setTimeout(() => router.push("/admin/product/view"), 400);
    } catch (err: any) {
      setError(err?.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ color: "#2563eb", textAlign: "center", padding: "32px" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <main
        style={{
          flex: 1,
          marginLeft: "0px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          width: "100%",
        }}
      >
        <ProfileHeader name={user.name} role={user.role} profilePhoto={user.profilePhoto} />

        <div
          style={{
            background: "rgba(255, 255, 255, 0.98)",
            padding: "40px",
            borderRadius: "20px",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
            width: "100%",
            maxWidth: "700px",
            marginTop: "30px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "20px",
            }}
          >
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>
              Add New Product
            </h1>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0", fontWeight: "500" }}>
              Complete the product details below
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div
              style={{
                backgroundColor: "#dcfce7",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                padding: "12px 16px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "15px",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "8px",
                }}
              >
                Basic Information
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Category
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., PROD-001-XYZ"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e2e8f0",
                    fontSize: "15px",
                    backgroundColor: "#ffffff",
                    transition: "all 0.2s ease",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "15px",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "8px",
                }}
              >
                Pricing & Inventory
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontWeight: "600",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    name="cost_price"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#ef4444")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    name="low_stock_alert_threshold"
                    value={formData.low_stock_alert_threshold}
                    onChange={handleChange}
                    placeholder="5"
                    min="0"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      backgroundColor: "#ffffff",
                      transition: "all 0.2s ease",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>
            </div>

            {/* Product Image Section */}
            <div style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "15px",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: "8px",
                }}
              >
                Product Image
              </h3>

              <div
                style={{
                  border: "3px dashed #d1d5db",
                  borderRadius: "15px",
                  padding: "30px",
                  textAlign: "center",
                  backgroundColor: "#f8fafc",
                  transition: "all 0.3s ease",
                  position: "relative",
                  minHeight: "150px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {!formData.image_url ? (
                  <>
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: "#e2e8f0",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "15px",
                        fontSize: "24px",
                      }}
                    >
                      📸
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                    <div style={{ fontSize: "16px", color: "#374151", fontWeight: "600", marginBottom: "5px" }}>
                      Click to upload product image
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>Or drag and drop your image here</div>
                  </>
                ) : (
                  <div style={{ position: "relative", maxWidth: "200px", margin: "0 auto" }}>
                    <img
                      src={formData.image_url?.startsWith("blob:") ? formData.image_url : `${process.env.NEXT_PUBLIC_API_URL}${formData.image_url}`}
                      alt={formData.name}
                      style={{ maxWidth: "100%", borderRadius: 8 }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_file: undefined, image_url: "" })}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "2px solid white",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Status Section */}
            <div style={{ marginBottom: "30px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "15px",
                  color: "#374151",
                  fontWeight: "500",
                  cursor: "pointer",
                  padding: "15px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "2px solid #e2e8f0",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                  e.currentTarget.style.borderColor = "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <input
                  type="checkbox"
                  name="status"
                  checked={formData.status}
                  onChange={handleChange}
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#10b981",
                  }}
                />
                <span style={{ textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "600" }}>
                  ✅ Product is Active
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "15px", marginTop: "35px", paddingTop: "25px", borderTop: "2px solid #e2e8f0" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  padding: "16px 24px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow: loading ? "none" : "0 4px 15px rgba(16, 185, 129, 0.3)",
                  transform: loading ? "none" : "translateY(0px)",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.3)";
                  }
                }}
              >
                {loading ? "⏳ Adding Product..." : "💾 Save Product"}
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  padding: "16px 24px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
                  transform: "translateY(0px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.3)";
                }}
                onClick={() => {
                  router.push("/admin/product/view");
                }}
              >
                🚫 Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}