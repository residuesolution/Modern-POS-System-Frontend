// ...existing code...
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavBar from "./TopNavBar";
import CreateBill from "./CreateBill";
import {
  FaPrint,
  FaEnvelopeOpenText,
  FaTrashAlt,
  FaReceipt,
  FaShoppingBasket,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
} from "react-icons/fa";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { fetchCurrentUser, fetchNotifications, createBill, emailOrderReceipt, smsOrderReceipt, printOrderReceipt, holdOrder, voidOrder } from "../services/authService";

type Product = {
  id: number | string;
  name: string;
  price: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  image?: string;
  image_url?: string;
  stock?: number;
  unit?: string;
  barcode?: string;
  sku?: string;
  description?: string;
};

type OrderSummary = {
  id: number | string;
  customerName?: string;
  totalItems?: number;
  totalAmount?: number;
  created_at?: string;
};

type CartItem = {
  product: Product;
  qty: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchWithToken(path: string) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {}
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function resolveImageUrl(url?: string) {
  if (!url) return "/images/placeholder.png";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${path}`;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Allowed categories (per your request). Use names that match Add Product select.
  const ALLOWED_CATEGORIES = ["Electronics", "Clothing", "Books", "Food"];

  // categoriesFromApi will contain only allowed categories (or fallback to ALLOWED_CATEGORIES)
  const [categoriesFromApi, setCategoriesFromApi] = useState<string[]>(ALLOWED_CATEGORIES.slice());
  const categoryChips = ["All products", ...ALLOWED_CATEGORIES];
  const [selectedCategory, setSelectedCategory] = useState<string>("All products");

  // simple id->name map for categories from backend (used when product has category_id)
  const [categoriesMap, setCategoriesMap] = useState<Record<string | number, string>>({});

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All");
  const [openSubcats, setOpenSubcats] = useState<Record<string, boolean>>({});

  const subcategoryMap: Record<string, string[]> = {
    "Dairy & Eggs": ["Milk & Cream", "Cheese", "Butter & Spreads", "Eggs", "Chocolates"],
    Vegetables: ["Leafy", "Root", "Stems", "Mixed Veg"],
    Fruits: ["Citrus", "Berries", "Tropical"],
    Bakery: ["Bread", "Pastries", "Cakes"],
    "Meat & Seafood": ["Beef", "Poultry", "Seafood"],
  };

  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [sortBy, setSortBy] = useState<string>("none");

  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string | number, any>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBill, setShowCreateBill] = useState(false);

  const productsRef = useRef<HTMLDivElement | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);

  const subcatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [subcatScrollState, setSubcatScrollState] = useState<Record<string, { left: boolean; right: boolean }>>({});

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollUpBill, setCanScrollUpBill] = useState(false);
  const [canScrollDownBill, setCanScrollDownBill] = useState(false);

  const prevVisibleCount = useRef<number>(0);
  const prevCartCount = useRef<number>(0);

  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const userInteractTimeout = useRef<number | null>(null);

  const [scrollDirection, setScrollDirection] = useState<"left" | "right">("left");
  const [pxPerFrame, setPxPerFrame] = useState<number>(1.8);

  async function handlePrintLatest() {
    const last = recentOrders[0];
    if (!last) return alert("No recent order");
    try {
      const res = await printOrderReceipt(Number(last.id));
      const html = (res && typeof res === "object" && "html" in res) ? (res as any).html : String(res ?? "");
      const w = window.open("", "_blank");
      if (w) {
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
      }
    } catch (e) { console.error(e); alert("Print failed"); }
  }

  async function handleEmailLatest() {
    const last = recentOrders[0];
    if (!last) return alert("No recent order");
    const to = prompt("Enter email to send receipt to:", "");
    if (!to) return;
    try {
      await emailOrderReceipt(Number(last.id), to);
      alert("Email sent");
    } catch (e) { console.error(e); alert("Email failed"); }
  }

  async function handleSmsLatest() {
    const last = recentOrders[0];
    if (!last) return alert("No recent order");
    const phone = prompt("Enter phone number:", "");
    if (!phone) return;
    try {
      await smsOrderReceipt(Number(last.id), phone);
      alert("Message sent");
    } catch (e) { console.error(e); alert("SMS failed"); }
  }

  async function handleHoldOrder(id?: number | string) {
    const orderId = id ?? (recentOrders[0]?.id);
    if (!orderId) return alert("No order selected");
    if (!confirm("Hold this order?")) return;
    try {
      await holdOrder(Number(orderId));
      alert("Order held");
      // optional: refresh orders
      await refreshOrders();
    } catch (e) { console.error(e); alert("Failed to hold"); }
  }

  async function handleVoidOrder(id?: number | string) {
    const orderId = id ?? (recentOrders[0]?.id);
    if (!orderId) return alert("No order selected");
    if (!confirm("Void this order?")) return;
    try {
      await voidOrder(Number(orderId));
      alert("Order voided");
      await refreshOrders();
    } catch (e) { console.error(e); alert("Failed to void"); }
  }

  useEffect(() => {
    (async () => {
      try {
        const u = await fetchCurrentUser().catch(() => null);
        const normalizedUser = u && typeof u === "object" ? ((u as any).user ?? (u as any).data ?? u) : u;
        setUser(normalizedUser ?? null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  // Helper to refresh orders and normalize counts & totals
  async function refreshOrders() {
    try {
      setLoading(true);
      const oResp = await fetchWithToken("/api/orders").catch(() => null);
      const ordersList: any[] = oResp?.data || oResp || [];
      const mappedOrders: OrderSummary[] = ordersList?.length
        ? ordersList.slice().reverse().slice(0, 20).map((o: any) => {
            const itemsArr = o.items || o.order_items || [];
            const totalItems = o.totalItems ?? o.total_items ?? (Array.isArray(itemsArr) ? itemsArr.reduce((s: number, it: any) => s + (Number(it.quantity ?? it.qty ?? 1) || 0), 0) : 0);
            const totalAmount = o.totalAmount ?? o.total_amount ?? (Array.isArray(itemsArr) ? itemsArr.reduce((s: number, it: any) => s + ((Number(it.unit_price ?? it.price ?? it.unitPrice) || 0) * (Number(it.quantity ?? it.qty ?? 1) || 0)), 0) : 0);
            return {
              id: o.id ?? o.orderId,
              customerName: o.customerName ?? (o.customer && o.customer.name) ?? `#${o.id}`,
              totalItems,
              totalAmount,
              created_at: o.created_at ?? o.createdAt ?? new Date().toISOString(),
            };
          })
        : [];
      setRecentOrders(mappedOrders);
      setExpandedOrders({}); // collapse any expanded views after refresh
    } catch (e) {
      console.error("refreshOrders failed", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // fetch categories first so we can map category_id -> name
        let categoriesList: any[] = [];
        try {
          const cResp = await fetchWithToken("/api/category").catch(() => null);
          categoriesList = cResp?.data || cResp || [];
        } catch (err) {
          categoriesList = [];
        }
        const catMap: Record<string | number, string> = {};
        (categoriesList || []).forEach((c: any) => {
          if (c && (c.id != null || c._id != null) && (c.name || c.category_name || c.title)) {
            const id = c.id ?? c._id;
            const name = c.name ?? c.category_name ?? c.title;
            catMap[id] = String(name).trim();
          }
        });
        if (mounted) setCategoriesMap(catMap);

        const pResp = await fetchWithToken("/api/product").catch(() => null);
        const productsList: any[] = pResp?.data || pResp || [];
        const nResp: any = await fetchNotifications().catch(() => null);
        const notifs: any[] = (nResp?.data || nResp || []) as any[];

        if (!mounted) return;

        const mappedProducts: Product[] = productsList?.length
          ? productsList.map((p: any) => {
              // preferred category name sources, fall back to mapping by category_id
              const byId = (p.category_id != null && catMap[p.category_id]) ? catMap[p.category_id] : undefined;
              const resolvedCategory = byId || p.categoryName || p.category || p.mainCategory || (p.category_id ? String(p.category_id) : "Uncategorized");
              return {
                id: p.id ?? p.productId ?? p.sku ?? Math.random().toString(36).slice(2, 9),
                name: p.name ?? p.productName ?? "Unnamed",
                price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
                category: String(resolvedCategory),
                subcategory: p.subcategory || p.category_sub || p.subCategory || undefined,
                brand: p.brand ?? p.manufacturer ?? p.brandName ?? undefined,
                image: p.image ?? p.image_url ?? "",
                image_url: p.image_url ?? p.image ?? "",
                stock: typeof p.stock === "number" ? p.stock : Number(p.stock) || 0,
                unit: p.unit ?? p.sku ?? "",
                barcode: p.barcode ?? p.upc ?? undefined,
                sku: p.sku ?? undefined,
                description: p.description ?? undefined,
              };
            })
          : [];

        setProducts(uniqueProducts(mappedProducts));

        // derive categoriesFromApi but restrict to allowed categories
        const apiCats = Array.from(new Set(mappedProducts.map((p) => (p.category || "").trim()))).filter(Boolean);
        const filtered = apiCats.filter((c) => ALLOWED_CATEGORIES.includes(c));
        setCategoriesFromApi(filtered.length ? filtered : ALLOWED_CATEGORIES.slice());

        setNotifications(Array.isArray(notifs) && notifs.length ? notifs : []);
      } catch (e) {
        // ignore simple load errors
      } finally {
        if (mounted) {
          // fetch orders after initial resources are loaded
          await refreshOrders();
        }
      }
    })();

    function onStorage(e: StorageEvent) {
      if (e.key === "product-added" && e.newValue) {
        (async () => {
          try {
            // refresh categories + products using same mapping logic
            let categoriesList: any[] = [];
            try {
              const cResp = await fetchWithToken("/api/category").catch(() => null);
              categoriesList = cResp?.data || cResp || [];
            } catch (err) {
              categoriesList = [];
            }
            const catMap: Record<string | number, string> = {};
            (categoriesList || []).forEach((c: any) => {
              if (c && (c.id != null || c._id != null) && (c.name || c.category_name || c.title)) {
                const id = c.id ?? c._id;
                const name = c.name ?? c.category_name ?? c.title;
                catMap[id] = String(name).trim();
              }
            });
            setCategoriesMap(catMap);

            const pResp = await fetchWithToken("/api/product").catch(() => null);
            const productsList: any[] = pResp?.data || pResp || [];
            const mappedProducts: Product[] = productsList?.length
              ? productsList.map((p: any) => {
                  const byId = (p.category_id != null && catMap[p.category_id]) ? catMap[p.category_id] : undefined;
                  const resolvedCategory = byId || p.categoryName || p.category || p.mainCategory || (p.category_id ? String(p.category_id) : "Uncategorized");
                  return {
                    id: p.id ?? p.productId ?? p.sku ?? Math.random().toString(36).slice(2, 9),
                    name: p.name ?? p.productName ?? "Unnamed",
                    price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
                    category: String(resolvedCategory),
                    subcategory: p.subcategory || p.category_sub || p.subCategory || undefined,
                    brand: p.brand ?? p.manufacturer ?? p.brandName ?? undefined,
                    image: p.image ?? p.image_url ?? "",
                    image_url: p.image_url ?? p.image ?? "",
                    stock: typeof p.stock === "number" ? p.stock : Number(p.stock) || 0,
                    unit: p.unit ?? p.sku ?? "",
                    barcode: p.barcode ?? p.upc ?? undefined,
                    sku: p.sku ?? undefined,
                    description: p.description ?? undefined,
                  };
                })
              : [];
            setProducts(uniqueProducts(mappedProducts));
            const apiCats = Array.from(new Set(mappedProducts.map((p) => (p.category || "").trim()))).filter(Boolean);
            const filtered = apiCats.filter((c) => ALLOWED_CATEGORIES.includes(c));
            setCategoriesFromApi(filtered.length ? filtered : ALLOWED_CATEGORIES.slice());
          } catch {}
        })();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function categoryMatches(apiCat: string | undefined, chip: string | null) {
    if (!chip || chip === "All products") return true;
    const c = (apiCat || "").toLowerCase();
    const s = chip.toLowerCase();
    if (s.includes("dairy")) return c.includes("dairy") || c.includes("milk") || c.includes("cheese") || c.includes("egg") || c.includes("eggs");
    if (s.includes("vegetable")) return c.includes("vegetable") || c.includes("vegetables") || c.includes("veg");
    if (s.includes("fruit")) return c.includes("fruit") || c.includes("fruits");
    if (s.includes("bakery") || s.includes("bread")) return c.includes("bakery") || c.includes("bread") || c.includes("pastry") || c.includes("cake");
    if (s.includes("meat") || s.includes("seafood")) return c.includes("meat") || c.includes("seafood") || c.includes("chicken") || c.includes("fish") || c.includes("beef");
    return c.includes(s);
  }

  function uniqueProducts(items: Product[]) {
    const map = new Map<string, Product>();
    for (const p of items || []) {
      const key =
        p.id != null && p.id !== ""
          ? String(p.id)
          : p.barcode
          ? `barcode:${p.barcode}`
          : p.sku
          ? `sku:${p.sku}`
          : `${(p.name || "").trim().toLowerCase()}::${String(p.price ?? "")}`;
      if (!map.has(key)) map.set(key, p);
    }
    return Array.from(map.values());
  }

  function subcategoryMatches(product: Product, sub: string | null, currentCategory?: string) {
    if (!sub || sub === "All") return true;
    const s = (sub || "").toLowerCase();
    const name = (product.name || "").toLowerCase();
    const cat = (product.category || "").toLowerCase();
    const subcat = (product.subcategory || "").toLowerCase();

    if (subcat && subcat.includes(s)) return true;

    if (currentCategory && categoryMatches(product.category, currentCategory)) {
      if (s.includes("egg")) return name.includes("egg");
      if (s.includes("milk") || s.includes("cream")) return name.includes("milk") || name.includes("cream");
      if (s.includes("cheese")) return name.includes("cheese");
      if (s.includes("butter") || s.includes("spread")) return name.includes("butter") || name.includes("spread");
      if (s.includes("seafood") || s.includes("prawn") || s.includes("salmon") || s.includes("fish") || s.includes("shrimp")) {
        return name.includes("prawn") || name.includes("prawns") || name.includes("salmon") || name.includes("fish") || name.includes("shrimp");
      }
      if (s.includes("chocolate") || s.includes("chocolates")) {
        return name.includes("chocolate") || subcat.includes("chocolate") || subcat.includes("chocolates");
      }
      return name.includes(s) || cat.includes(s);
    }
    return false;
  }

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach((p) => {
      if (p.brand) b.add(String(p.brand));
    });
    return ["All Brands", ...Array.from(b).sort()];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const apiProducts = products || [];

    const categoryFiltered =
      selectedCategory === "All products"
        ? [...apiProducts]
        : apiProducts.filter((p) => categoryMatches(p.category, selectedCategory));

    const brandFiltered =
      selectedBrand && selectedBrand !== "All Brands"
        ? categoryFiltered.filter((p) => (p.brand || "").toLowerCase().includes(selectedBrand.toLowerCase()))
        : categoryFiltered;

    const sorted = [...brandFiltered];
    if (sortBy === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "price-asc") sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-desc") sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    return sorted;
  }, [products, selectedCategory, selectedBrand, sortBy]);

  useEffect(() => {
    const cur = productsRef.current;
    const prev = prevVisibleCount.current;
    const curLen = visibleProducts.length;
    if (cur && curLen > prev) {
      cur.scrollTo({ left: cur.scrollWidth - cur.clientWidth, behavior: "smooth" });
    }
    prevVisibleCount.current = curLen;
  }, [visibleProducts]);

  useEffect(() => {
    const el = productsRef.current;
    if (!el || selectedCategory !== "All products" || visibleProducts.length <= 1) return;

    const clearUserTimeout = () => {
      if (userInteractTimeout.current) {
        window.clearTimeout(userInteractTimeout.current);
        userInteractTimeout.current = null;
      }
    };

    const onUserInteract = () => {
      setAutoScrollPaused(true);
      clearUserTimeout();
      userInteractTimeout.current = window.setTimeout(() => {
        setAutoScrollPaused(false);
        userInteractTimeout.current = null;
      }, 1500);
    };

    el.addEventListener("pointerdown", onUserInteract);
    el.addEventListener("wheel", onUserInteract, { passive: true });
    el.addEventListener("touchstart", onUserInteract, { passive: true });

    const maxScroll = () => (el ? el.scrollWidth - el.clientWidth : 0);

    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const curEl = productsRef.current;
      if (!curEl) return;
      const dt = now - last;
      last = now;
      if (!autoScrollPaused && curEl.scrollWidth > curEl.clientWidth) {
        const move = pxPerFrame * (dt / 16.6667);
        if (scrollDirection === "left") {
          curEl.scrollLeft -= move;
          if (curEl.scrollLeft <= 0) {
            curEl.scrollLeft = Math.max(0, maxScroll());
          }
        } else {
          curEl.scrollLeft += move;
          if (curEl.scrollLeft >= maxScroll()) {
            curEl.scrollLeft = 0;
          }
        }
      }
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(rafId);
      el.removeEventListener("pointerdown", onUserInteract);
      el.removeEventListener("wheel", onUserInteract);
      el.removeEventListener("touchstart", onUserInteract);
      clearUserTimeout();
    };
  }, [selectedCategory, visibleProducts, autoScrollPaused, scrollDirection, pxPerFrame]);

  useEffect(() => {
    const prev = prevCartCount.current;
    const cur = cartRef.current;
    if (cur && cart.length > prev && cart.length >= 3) {
      cur.scrollTo({ top: cur.scrollHeight, behavior: "smooth" });
    }
    prevCartCount.current = cart.length;
  }, [cart]);

  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const found = prev.find((it) => it.product.id === product.id);
      if (found) return prev.map((it) => (it.product.id === product.id ? { ...it, qty: it.qty + qty } : it));
      return [{ product, qty }, ...prev];
    });
  }
  function updateQty(productId: string | number, qty: number) {
    setCart((prev) =>
      prev
        .map((it) => (it.product.id === productId ? { ...it, qty: Math.max(0, qty) } : it))
        .filter((it) => it.qty > 0)
    );
  }
  function removeFromCart(productId: string | number) {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  }
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((s, it) => s + (it.product.price || 0) * it.qty, 0);
    const discount = Math.round(subtotal * 0.10);
    const tax = Math.round(subtotal * 0.15);
    const grand = subtotal - discount + tax;
    return { subtotal, discount, tax, grand };
  }, [cart]);

  // updated checkout uses refreshOrders
  async function handleCheckout(paymentMethod = "CASH") {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    const order = {
      customer_id: null,
      user_id: user?.id ?? null,
      payment_method: paymentMethod,
      total_amount: cartTotals.grand,
      discount_amount: cartTotals.discount,
      loyalty_points_used: 0,
      status: "completed",
    };
    const items = cart.map((it) => ({ product_id: it.product.id, quantity: it.qty, unit_price: it.product.price }));
    try {
      const res = await createBill({ order, items });
      setCart([]);
      alert("Checkout successful");
      try {
        localStorage.setItem("product-updated", Date.now().toString());
      } catch {}
      // refresh orders using helper
      await refreshOrders();
    } catch (err) {
      console.error("checkout failed", err);
      alert("Checkout failed");
    }
  }

  const qtyInCart = (productId: string | number) => {
    const it = cart.find((c) => c.product.id === productId);
    return it ? it.qty : 0;
  };

  const PROD_STEP = 340;
  function scrollProducts(direction: "left" | "right", ref?: React.RefObject<HTMLDivElement>) {
    const el = (ref && ref.current) || productsRef.current;
    if (!el) return;
    const delta = direction === "left" ? -PROD_STEP : PROD_STEP;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }
  const BILL_STEP = 240;
  function scrollBilling(direction: "up" | "down") {
    const el = billingRef.current;
    if (!el) return;
    const delta = direction === "up" ? -BILL_STEP : BILL_STEP;
    el.scrollBy({ top: delta, behavior: "smooth" });
  }

  function updateSubcatNav(sub: string) {
    const el = subcatRefs.current[sub];
    if (!el) {
      setSubcatScrollState((prev) => ({ ...prev, [sub]: { left: false, right: false } }));
      return;
    }
    setSubcatScrollState((prev) => ({
      ...prev,
      [sub]: { left: el.scrollLeft > 10, right: el.scrollLeft + el.clientWidth + 10 < el.scrollWidth },
    }));
  }

  const SUBCAT_STEP = 340;
  function scrollSubcat(sub: string, direction: "left" | "right") {
    const el = subcatRefs.current[sub];
    if (!el) return;
    const delta = direction === "left" ? -SUBCAT_STEP : SUBCAT_STEP;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  useEffect(() => {
    function updateProductNav() {
      const el = productsRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft + el.clientWidth + 10 < el.scrollWidth);
    }
    function updateBillingNav() {
      const el = billingRef.current;
      if (!el) return;
      setCanScrollUpBill(el.scrollTop > 10);
      setCanScrollDownBill(el.scrollTop + el.clientHeight + 10 < el.scrollHeight);
    }
    updateProductNav();
    updateBillingNav();
    const prod = productsRef.current;
    const bill = billingRef.current;
    prod?.addEventListener("scroll", updateProductNav);
    bill?.addEventListener("scroll", updateBillingNav);
    window.addEventListener("resize", updateProductNav);
    window.addEventListener("resize", updateBillingNav);
    return () => {
      prod?.removeEventListener("scroll", updateProductNav);
      bill?.removeEventListener("scroll", updateBillingNav);
      window.removeEventListener("resize", updateProductNav);
      window.removeEventListener("resize", updateBillingNav);
    };
  }, [visibleProducts, recentOrders]);

  useEffect(() => {
    const subs = subcategoryMap[selectedCategory] || [];
    const cleanupFns: Array<() => void> = [];
    subs.forEach((sub) => {
      const el = subcatRefs.current[sub];
      if (!el) return;
      const onScroll = () => updateSubcatNav(sub);
      el.addEventListener("scroll", onScroll);
      window.addEventListener("resize", onScroll);
      updateSubcatNav(sub);
      cleanupFns.push(() => {
        el.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      });
    });
    return () => cleanupFns.forEach((fn) => fn());
  }, [selectedCategory, visibleProducts, openSubcats]);

  function toggleSubcat(sub: string) {
    setOpenSubcats((prev) => ({ ...prev, [sub]: !prev[sub] }));
    setSelectedSubcategory(sub);
  }

  function productsForSubcategory(sub: string): Product[] {
    if (!sub || sub === "All") return visibleProducts;
    return visibleProducts.filter((p) => subcategoryMatches(p, sub, selectedCategory));
  }

  // Toggle order details: fetch on demand and update recentOrders summary
  async function toggleOrderDetails(id?: number | string) {
    if (!id) return;
    const key = String(id);
    if (expandedOrders[key]) {
      setExpandedOrders((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    try {
      const resp = await fetchWithToken(`/api/orders/${id}`).catch(() => null);
      const orderObj = resp?.data || resp || null;
      if (!orderObj) {
        setExpandedOrders((prev) => ({ ...prev, [key]: { items: [] } }));
        return;
      }

      const items = orderObj.items || orderObj.order_items || orderObj.line_items || [];
      const totalItems = items.length ? items.reduce((s: number, it: any) => s + (Number(it.quantity ?? it.qty ?? 1) || 0), 0) : (orderObj.totalItems ?? orderObj.total_items ?? 0);
      const totalAmount = orderObj.totalAmount ?? orderObj.total_amount ?? (items.length ? items.reduce((s: number, it: any) => s + ((Number(it.unit_price ?? it.price ?? it.unitPrice) || 0) * (Number(it.quantity ?? it.qty ?? 1) || 0)), 0) : 0);

      setExpandedOrders((prev) => ({ ...prev, [key]: { ...orderObj, items, totalItems, totalAmount } }));

      setRecentOrders((prev) => prev.map((o) => (String(o.id) === key ? { ...o, totalItems, totalAmount } : o)));
    } catch (err) {
      console.error("Failed to load order details", err);
    }
  }

  const groupedOrders = useMemo(() => {
    const groups: Record<string, OrderSummary[]> = {};
    (recentOrders || []).forEach((o) => {
      const d = o?.created_at ? new Date(o.created_at) : new Date();
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      groups[key] = groups[key] || [];
      groups[key].push(o);
    });
    // sort groups' orders newest first
    Object.keys(groups).forEach((k) => {
      groups[k].sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    });
    return groups;
  }, [recentOrders]);

  function formatGroupLabel(dateKey: string) {
    const d = new Date(dateKey);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round((today.getTime() - d.getTime()) / msPerDay);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }); // e.g. "Mon, 10 Nov"
  }
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-200 via-blue-400 to-blue-700">
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <Sidebar active="dashboard" />
      <div className="flex-1 flex flex-col" style={{ marginLeft: 256 }}>
        <TopNavBar user={user} onCreateBill={() => setShowCreateBill(true)} />
        <main className="flex-1 p-6 mt-16">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-blue-900">Products</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="border rounded px-2 text-xs text-gray-700"
                      aria-label="Product Brand"
                    >
                      {brands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border rounded px-2 text-xs text-gray-700"
                      aria-label="Sort By"
                    >
                      <option value="none">Sort By</option>
                      <option value="name-asc">Name A → Z</option>
                      <option value="price-asc">Price Low → High</option>
                      <option value="price-desc">Price High → Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {categoryChips.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCategory(c);
                        setSelectedSubcategory("All");
                        setOpenSubcats({});
                        setSelectedBrand("All Brands");
                        setSortBy("none");
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedCategory === c ? "bg-blue-600 text-white" : "bg-white text-blue-700 border hover:bg-blue-50"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {selectedCategory === "All products" ? (
                  <div className="bg-gray-50 rounded-lg mt-2 relative">
                    <div className="pt-3 px-3">
                      <div className="relative">
                        <div className="absolute right-3 top-3 z-30 flex gap-2 items-center">
                          <button
                            title="Move left (items travel right → left)"
                            onClick={() => setScrollDirection("left")}
                            className={`px-2 py-1 text-xs rounded ${scrollDirection === "left" ? "bg-blue-600 text-white" : "bg-white border text-blue-700"}`}
                          >
                            ←
                          </button>
                          <button
                            title="Move right (items travel left → right)"
                            onClick={() => setScrollDirection("right")}
                            className={`px-2 py-1 text-xs rounded ${scrollDirection === "right" ? "bg-blue-600 text-white" : "bg-white border text-blue-700"}`}
                          >
                            →
                          </button>
                        </div>

                        <div
                          ref={productsRef}
                          className="no-scrollbar overflow-x-auto px-1 py-2"
                          style={{ scrollBehavior: "auto", paddingLeft: 56, paddingRight: 56 }}
                        >
                          <div className="flex gap-3 items-start flex-nowrap whitespace-nowrap">
                            {visibleProducts.length === 0 ? (
                              <div className="text-sm text-gray-700 p-4">No products available</div>
                            ) : (
                              visibleProducts.map((p) => {
                                const qty = qtyInCart(p.id);
                                return (
                                  <div
                                    key={String(p.id)}
                                    className={`flex-shrink-0 min-w-[160px] p-3 bg-white rounded shadow-sm flex flex-col items-center`}
                                  >
                                    <img src={resolveImageUrl(p.image || p.image_url)} alt={p.name} className="h-20 object-contain mb-2" />
                                    <div className="text-xs font-semibold text-gray-800 text-center">{p.name}</div>
                                    <div className="text-[11px] text-gray-700 text-center">
                                      {p.brand && <span className="mr-1 text-[10px] text-gray-500">{p.brand}</span>}
                                      {p.subcategory && <span className="mx-1">• {p.subcategory}</span>}
                                      {p.unit && <span className="ml-1">{p.unit}</span>}
                                    </div>
                                    <div className="text-blue-800 font-semibold text-xs mt-2">Rs. {p.price}</div>

                                    <div className="mt-3 flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          if (qty > 0) updateQty(p.id, qty - 1);
                                        }}
                                        className="px-2 py-1 bg-gray-100 rounded text-xs text-blue-800"
                                        aria-label={`decrease-${p.id}`}
                                      >
                                        -
                                      </button>
                                      <span className="px-2 text-xs font-semibold">{qty}</span>
                                      <button
                                        onClick={() => addToCart(p, 1)}
                                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                        aria-label={`increase-${p.id}`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {(subcategoryMap[selectedCategory] || []).map((sub) => {
                      const items = productsForSubcategory(sub);
                      const isOpen = !!openSubcats[sub];
                      return (
                        <div key={sub} className="rounded-lg border bg-white overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="text-sm font-semibold text-blue-800">{sub}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-600 mr-2">{items.length} items</div>
                              <button
                                aria-label={`toggle-${sub}`}
                                onClick={() => toggleSubcat(sub)}
                                className={`p-2 rounded-full bg-gray-50 border text-blue-700 ${isOpen ? "bg-blue-600 text-white" : ""}`}
                              >
                                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                              </button>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="px-3 pb-3">
                              <div className="relative">
                                <button
                                  aria-label={`subcat-${sub}-left`}
                                  onClick={() => scrollSubcat(sub, "left")}
                                  disabled={!subcatScrollState[sub]?.left}
                                  className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white border text-blue-700 shadow ${subcatScrollState[sub]?.left ? "" : "opacity-40 cursor-not-allowed"}`}
                                >
                                  <FaChevronLeft />
                                </button>

                                <div
                                  ref={(el) => { subcatRefs.current[sub] = el; }}
                                  className="no-scrollbar overflow-x-auto px-1 py-2"
                                  style={{ scrollBehavior: "smooth", paddingLeft: 48, paddingRight: 48 }}
                                >
                                  <div className="flex gap-3 items-start py-2 flex-nowrap">
                                    {items.length === 0 ? (
                                      <div className="text-sm text-gray-700 p-4">No products in this subcategory</div>
                                    ) : (
                                      items.map((p) => {
                                        const qty = qtyInCart(p.id);
                                        return (
                                          <div
                                            key={p.id}
                                            className={`flex-shrink-0 min-w-[160px] p-3 bg-gray-50 rounded shadow-sm flex flex-col items-center`}
                                          >
                                            <img src={resolveImageUrl(p.image || p.image_url)} alt={p.name} className="h-20 object-contain mb-2" />
                                            <div className="text-xs font-semibold text-gray-800 text-center">{p.name}</div>
                                            <div className="text-[11px] text-gray-700 text-center">
                                              {p.brand && <span className="mr-1 text-[10px] text-gray-500">{p.brand}</span>}
                                              {p.unit && <span className="mx-1">{p.unit}</span>}
                                              {p.stock ? <span className="ml-1">{p.stock} in stock</span> : null}
                                            </div>
                                            <div className="text-blue-800 font-semibold text-xs mt-2">Rs. {p.price}</div>

                                            <div className="mt-3 flex items-center gap-2">
                                              <button
                                                onClick={() => {
                                                  if (qty > 0) updateQty(p.id, qty - 1);
                                                }}
                                                className="px-2 py-1 bg-gray-100 rounded text-xs text-blue-800"
                                                aria-label={`decrease-${p.id}`}
                                              >
                                                -
                                              </button>
                                              <span className="px-2 text-xs font-semibold">{qty}</span>
                                              <button
                                                onClick={() => addToCart(p, 1)}
                                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                                aria-label={`increase-${p.id}`}
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>

                                <button
                                  aria-label={`subcat-${sub}-right`}
                                  onClick={() => scrollSubcat(sub, "right")}
                                  disabled={!subcatScrollState[sub]?.right}
                                  className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white border text-blue-700 shadow ${subcatScrollState[sub]?.right ? "" : "opacity-40 cursor-not-allowed"}`}
                                >
                                  <FaChevronRight />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow p-4 relative">
                <div className="flex items-center flex-wrap justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaReceipt className="text-blue-700" size={18} aria-hidden />
                    <h3 className="text-base font-semibold text-blue-900">Billing History</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* show label for the most recent group */}
                    <span className="text-xs text-gray-800 font-semibold">
                      {Object.keys(groupedOrders).length ? formatGroupLabel(Object.keys(groupedOrders).sort((a,b)=> b.localeCompare(a))[0]) : ""}
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <button
                    aria-label="billing-up"
                    onClick={() => scrollBilling("up")}
                    disabled={!canScrollUpBill}
                    className={`absolute right-1 top-4 z-40 p-2 rounded-full bg-white border text-blue-700 shadow ${canScrollUpBill ? "" : "opacity-40 cursor-not-allowed"}`}
                  >
                    <FaChevronUp />
                  </button>

                  <div
                    ref={billingRef}
                    className="no-scrollbar max-h-[420px] overflow-y-auto pr-2 space-y-2"
                    style={{ scrollBehavior: "smooth", paddingTop: 8, paddingBottom: 8 }}
                  >
                    {loading ? (
                      <div className="text-xs text-gray-700">Loading orders...</div>
                    ) : Object.keys(groupedOrders).length === 0 ? (
                      <div className="text-xs text-gray-700">No recent orders</div>
                    ) : (
                      // render groups sorted newest date first
                      Object.keys(groupedOrders)
                        .sort((a, b) => b.localeCompare(a))
                        .map((dateKey) => (
                          <div key={dateKey} className="space-y-2">
                            <div className="text-xs text-gray-600 font-semibold px-2">{formatGroupLabel(dateKey)}</div>

                            {groupedOrders[dateKey].map((o) => {
                              const key = String(o.id);
                              const expanded = !!expandedOrders[key];
                              const details = expandedOrders[key];

                              return (
                                <div key={o.id} className="space-y-2">
                                  <div className="flex items-center justify-between rounded p-3 border bg-gray-100">
                                    <div className="flex items-center gap-2">
                                      <div>
                                        <div className="text-sm font-semibold text-blue-800">{o.customerName || `#${o.id}`}</div>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-xs font-semibold text-gray-700">Items: {o.totalItems ?? 0}</div>
                                      <div className="text-xs font-semibold text-blue-800">Rs. {o.totalAmount ?? 0}</div>
                                    </div>

                                    <button
                                      onClick={() => toggleOrderDetails(o.id)}
                                      className="px-3 py-1 text-xs rounded text-blue-500 bg-white border"
                                      aria-expanded={expanded}
                                      title={expanded ? "Collapse order details" : "Expand order details"}
                                    >
                                      {expanded ? "▲" : "▼"}
                                    </button>
                                  </div>

                                  {/* Expanded content: show items when order is expanded */}
                                  {expanded && details && (
                                    <div className="px-3">
                                      {Array.isArray(details.items) && details.items.length > 0 ? (
                                        <div className="space-y-2 text-xs text-gray-700">
                                          {details.items.map((it: any, idx: number) => {
                                            const qty = Number(it.quantity ?? it.qty ?? 1);
                                            const unit = Number(it.unit_price ?? it.price ?? it.unitPrice ?? it.rate ?? 0);
                                            const name = it.productName || it.name || it.product?.name || String(it.product_id ?? it.product?.id ?? `Item ${idx + 1}`);
                                            return (
                                              <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border">
                                                <div className="truncate w-2/3 text-sm">{name}</div>
                                                <div className="text-right w-1/3">
                                                  <div className="text-[12px] text-gray-600">{qty} × Rs. {unit}</div>
                                                  <div className="text-sm font-semibold text-blue-800">Rs. {qty * unit}</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          <div className="flex justify-between pt-2 border-t text-xs font-semibold">
                                            <div>Total items</div>
                                            <div>{details.totalItems ?? details.items.reduce((s: number, it: any) => s + (Number(it.quantity ?? it.qty ?? 1) || 0), 0)}</div>
                                          </div>
                                          <div className="flex justify-between text-xs font-semibold">
                                            <div>Total amount</div>
                                            <div>Rs. {details.totalAmount ?? details.items.reduce((s: number, it: any) => s + ((Number(it.unit_price ?? it.price ?? 0) || 0) * (Number(it.quantity ?? it.qty ?? 1) || 0)), 0)}</div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-gray-500 p-2">No items available for this order</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))
                    )}
                  </div>

                  <button
                    aria-label="billing-down"
                    onClick={() => scrollBilling("down")}
                    disabled={!canScrollDownBill}
                    className={`absolute right-1 bottom-4 z-20 p-2 rounded-full bg-white border text-blue-700 shadow ${canScrollDownBill ? "" : "opacity-40 cursor-not-allowed"}`}
                  >
                    <FaChevronDown />
                  </button>
                </div>
              </div>

            </section>

            <aside className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FaShoppingBasket className="text-blue-700" size={18} aria-hidden />
                    <h3 className="text-base font-semibold text-blue-900">Cart</h3>
                    <div className="text-xs text-gray-800">{cart.length} items</div>
                  </div>

                  <button
                    title="Clear cart"
                    onClick={() => {
                      if (cart.length === 0) return;
                      if (window.confirm("Clear cart?")) setCart([]);
                    }}
                    className="p-2 rounded-md text-red-500 hover:bg-red-50"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </div>

                <div
                  ref={cartRef}
                  // show native scrollbar when more than 3 items; hide scrollbar for 3 or fewer
                  className={`${cart.length >= 3 ? "overflow-y-auto" : "overflow-visible no-scrollbar"}`}
                  style={{ maxHeight: cart.length >= 3 ? 300 : "auto", transition: "max-height 200ms ease" }}
                >
                  {cart.length === 0 ? (
                    <div className="text-sm text-gray-700">Cart is empty</div>
                  ) : (
                    cart.map((it) => (
                      <div key={it.product.id} className="flex items-center gap-3 py-1">
                        <img
                          src={resolveImageUrl(it.product.image || it.product.image_url)}
                          alt={it.product.name}
                          className="h-8 w-8 rounded border bg-gray-200"
                        />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-gray-800">{it.product.name}</div>
                          <div className="text-xs text-gray-700">{it.product.category} • {it.product.subcategory} • {it.product.brand}</div>
                        </div>
                        <div className="text-xs text-blue-900 font-semibold">Rs. {it.product.price}</div>
                        <div className="flex items-center gap-1 ml-3">
                          <button onClick={() => updateQty(it.product.id, it.qty - 1)} className="px-2 py-1 bg-gray-100 rounded text-xs text-blue-800">-</button>
                          <span className="px-2 text-xs font-semibold">{it.qty}</span>
                          <button onClick={() => updateQty(it.product.id, it.qty + 1)} className="px-2 py-1 bg-gray-100 rounded text-xs text-blue-800">+</button>
                          <button onClick={() => removeFromCart(it.product.id)} className="ml-2 text-xs text-red-500">✕</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 py-2 border-t space-y-1">
                  <div className="flex justify-between text-xs text-blue-900 font-semibold">
                    <span>Bill</span>
                    <span>Rs. {cartTotals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-900 font-semibold">
                    <span>Discount (10%)</span>
                    <span>Rs. {cartTotals.discount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-900 font-semibold">
                    <span>Tax (15%)</span>
                    <span>Rs. {cartTotals.tax}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base text-blue-900 py-1">
                    <span>Grand Total</span>
                    <span>Rs. {cartTotals.grand}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleCheckout("CASH")} className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white font-semibold rounded">CASH</button>
                  <button onClick={() => handleCheckout("CARD")} className="px-3 py-2 text-sm bg-blue-600 text-white font-semibold rounded">CARD</button>
                  <button onClick={() => handleCheckout("LOYALTY")} className="px-3 py-2 text-sm bg-blue-600 text-white font-semibold rounded">LOYALTY</button>
                </div>

                <button className="mt-2 w-full px-3 py-2 text-sm bg-blue-600 text-white font-semibold rounded">DIGITAL WALLET</button>

                <div className="mt-3 flex gap-4 justify-center items-center">
                  <button title="Print" className="p-3 bg-blue-50 border rounded-full text-blue-700 hover:bg-blue-100 hover:scale-105 transition">
                    <FaPrint size={20} />
                  </button>
                  <button title="Mail" className="p-3 bg-green-50 border rounded-full text-green-700 hover:bg-green-100 hover:scale-105 transition">
                    <FaEnvelopeOpenText size={20} />
                  </button>
                  <button title="Message" className="p-3 bg-yellow-50 border rounded-full text-yellow-700 hover:bg-yellow-100 hover:scale-105 transition">
                    <IoChatbubbleEllipsesOutline size={22} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow p-4">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-800 border font-semibold rounded">VOID</button>
                  <button className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-800 border font-semibold rounded">HOLD</button>
                  <button className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-800 border font-semibold rounded">DISCOUNT</button>
                  <button className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-800 border font-semibold rounded">CUSTOMER LOOKUP</button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {showCreateBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md">
            <CreateBill
              onBillCreated={async () => {
                setShowCreateBill(false);
                setCart([]);
                await refreshOrders();
              }}
            />
            <div className="mt-2 text-right">
              <button className="mt-2 px-3 py-1 bg-gray-200 rounded" onClick={() => setShowCreateBill(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ...existing code...