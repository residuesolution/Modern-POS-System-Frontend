"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import ProfileHeader from "@/components/ProfileHeader";
import { fetchCurrentUser } from "@/services/authService";

const orderStatuses = ["IN_TRANSIT", "APPROVAL", "DELIVERED"];

const AddSupplierOrderPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string>("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  // Fetch products
  React.useEffect(() => {
    async function fetchProducts() {
      setProductsLoading(true);
      setProductsError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const authToken = localStorage.getItem("authToken");
        const res = await fetch(`${apiUrl}/api/product`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        } else {
          setProductsError("Failed to fetch products.");
        }
      } catch (err) {
        setProductsError("Network error while fetching products.");
      } finally {
        setProductsLoading(false);
      }
    }
    fetchProducts();
  }, []);
  // Add product row
  const addProductRow = () => {
    // Only allow one product row
    if (orderItems.length === 0) {
      setOrderItems([{ product_id: "", quantity: 1 }]);
    }
  };

  // Remove product row
  const removeProductRow = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Update product row
  const updateProductRow = (idx: number, field: string, value: any) => {
    const updated = [...orderItems];
    if (field === "product_id") {
      updated[idx].product_id = value;
    } else if (field === "quantity") {
      updated[idx].quantity = Number(value);
    }
    setOrderItems(updated);
  };
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    supplierName: "",
    itemsOrdered: "",
    expectedDelivery: "",
    // status: "APPROVAL",
  });

  const router = useRouter();

  // Fetch current user
  React.useEffect(() => {
    async function getUser() {
      const userData: any = await fetchCurrentUser();
      const currentUser =
        (userData && userData.user) ? userData.user :
        (userData && userData.data) ? userData.data :
        userData || null;
      setUser(currentUser);

      if (!currentUser || !["ADMIN", "MANAGER"].includes(currentUser.role || "")) {
        router.replace("/unauthorized");
      }
    }
    getUser();
  }, [router]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const authToken = localStorage.getItem("authToken");
      // Only one product row is allowed
      const item = orderItems[0];
      const payload = {
        supplierName: formData.supplierName,
        itemOrdered: {
          productId: item?.product_id,
          quantity: item?.quantity,
        },
        expectedDelivery: formData.expectedDelivery,
        // status: formData.status,
      };
      const response = await fetch(`${apiUrl}/api/supplier-order/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to add supplier order: ${errText}`);
      }

      setSuccess("Supplier order added successfully!");
      router.push("/admin/product/view");
    } catch (err: any) {
      setError(err?.message || "Failed to add supplier order.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ textAlign: "center", padding: "32px" }}>Loading...</div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar active="supplier-order-add" />
      <main style={{ flex: 1, padding: "20px" }}>
        <ProfileHeader name={user.name} role={user.role} profilePhoto={user.profilePhoto} />

        <div style={{ background: "#fff", padding: "40px", borderRadius: "16px", maxWidth: "700px", margin: "30px auto" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "20px", textAlign: "center" }}>
            Create Supplier Order
          </h1>

          {error && <div style={{ backgroundColor: "#fee2e2", padding: "10px", borderRadius: "8px", marginBottom: "15px", color: "#dc2626" }}>⚠️ {error}</div>}
          {success && <div style={{ backgroundColor: "#dcfce7", padding: "10px", borderRadius: "8px", marginBottom: "15px", color: "#16a34a" }}>✅ {success}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            <div>
              <label>Supplier Name</label>
              <input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
            </div>

         

            {/* Products Section */}
            <div>
              <h3>Product</h3>
              {productsLoading ? (
                <div style={{ padding: "10px", color: "#64748b" }}>Loading products...</div>
              ) : productsError ? (
                <div style={{ padding: "10px", color: "#dc2626" }}>{productsError}</div>
              ) : (
                <>
                  {orderItems.length === 0 ? (
                    <button
                      type="button"
                      onClick={addProductRow}
                      style={{ marginTop: "10px", padding: "10px 18px", borderRadius: "8px", background: "#2563eb", color: "#fff" }}
                    >
                      + Add Product
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "center" }}>
                      <div style={{ flex: 2 }}>
                        <select
                          value={orderItems[0].product_id || ""}
                          onChange={(e) => updateProductRow(0, "product_id", e.target.value)}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.id} - {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        value={orderItems[0].quantity}
                        min="1"
                        onChange={(e) => updateProductRow(0, "quantity", e.target.value)}
                        style={{ flex: 1, padding: "10px", borderRadius: "8px" }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label>Expected Delivery</label>
              <input
                type="date"
                name="expectedDelivery"
                value={formData.expectedDelivery}
                onChange={handleChange}
                required
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
              />
            </div>

            {/* <div>
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
              >
                {orderStatuses.map((os) => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div> */}

            <button
              type="submit"
              disabled={loading}
              style={{ background: loading ? "#94a3b8" : "#2563eb", color: "#fff", padding: "14px", borderRadius: "10px", fontWeight: "600" }}
            >
              {loading ? "Processing..." : "Save Supplier Order"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddSupplierOrderPage;
