'use client';
import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import Sidebar from "@/components/Sidebar";
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

  React.useEffect(() => {
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
      router.push("/admin/customer/view");
    } catch (err: any) {
      setError(err?.message || "Failed to add customer.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ color: "#2563eb", textAlign: "center", padding: "32px" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar active="customer-view" />
      <main
        style={{
          flex: 1,
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
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#1e293b",
                margin: "0 0 8px 0",
              }}
            >
              Add New Customer
            </h1>
            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                margin: "0",
                fontWeight: "500",
              }}
            >
              Enter the customer details below
            </p>
          </div>

          {/* Alerts */}
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
                Customer Information
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                  marginBottom: "20px",
                }}
              >
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
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
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
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
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
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g., +1 234 567 890"
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
                    Loyalty Points
                  </label>
                  <input
                    type="number"
                    name="loyaltyPoints"
                    min="0"
                    value={formData.loyaltyPoints}
                    onChange={handleChange}
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

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "15px",
                marginTop: "35px",
                paddingTop: "25px",
                borderTop: "2px solid #e2e8f0",
              }}
            >
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: loading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                  boxShadow: loading
                    ? "none"
                    : "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                {loading ? "⏳ Adding..." : "💾 Save Customer"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/customer/view")}
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
};

export default AddCustomerPage;
