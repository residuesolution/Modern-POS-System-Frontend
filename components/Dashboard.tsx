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
import { fetchCurrentUser, fetchProductByBarcode, createBill, fetchNotifications } from "../services/authService";

type Product = {
  id: number | string;
  name: string;
  price: number;
  category?: string;        // Main category (e.g. Vegetables, Fruits, Bakery)
  subcategory?: string;     // Subcategory (e.g. Leafy, Citrus, Pastries)
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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesFromApi, setCategoriesFromApi] = useState<string[]>([]);
  // fixed display order for category chips
  const categoryChips = ["All products", "Dairy & Eggs", "Vegetables", "Fruits", "Bakery", "Meat & Seafood"];
  const [selectedCategory, setSelectedCategory] = useState<string>("All products");

  // subcategory state & open toggles
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("All");
  const [openSubcats, setOpenSubcats] = useState<Record<string, boolean>>({});

  // subcategory map for each main category
  const subcategoryMap: Record<string, string[]> = {
    // Added "Chocolates" under "Dairy & Eggs"
    "Dairy & Eggs": ["Milk & Cream", "Cheese", "Butter & Spreads", "Eggs", "Chocolates"],
    Vegetables: ["Leafy", "Root", "Stems", "Mixed Veg"],
    Fruits: ["Citrus", "Berries", "Tropical"],
    Bakery: ["Bread", "Pastries", "Cakes"],
    "Meat & Seafood": ["Beef", "Poultry", "Seafood"],
  };

  // brand & sort state
  const [selectedBrand, setSelectedBrand] = useState<string>("All Brands");
  const [sortBy, setSortBy] = useState<string>("none"); // none | name-asc | price-asc | price-desc

  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBill, setShowCreateBill] = useState(false);

  // refs for programmatic scrolling
  const productsRef = useRef<HTMLDivElement | null>(null);
  const billingRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);

  // per-subcategory refs & scroll state
  const subcatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [subcatScrollState, setSubcatScrollState] = useState<Record<string, { left: boolean; right: boolean }>>({});

  // nav controls
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollUpBill, setCanScrollUpBill] = useState(false);
  const [canScrollDownBill, setCanScrollDownBill] = useState(false);

  // prev counts
  const prevVisibleCount = useRef<number>(0);
  const prevCartCount = useRef<number>(0);

  // auto-scroll control for "All products"
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const userInteractTimeout = useRef<number | null>(null);

  // new: direction and speed control for continuous loop
  const [scrollDirection, setScrollDirection] = useState<"left" | "right">("left");
  const [pxPerFrame, setPxPerFrame] = useState<number>(1.8); // tune speed

  // Demo products — expanded to include explicit subcategory, image_url, barcode, sku, description
  // Replace placeholder images with your hosted images if desired.
  const demoProducts: Product[] = [
    { id: "d_001", name: "Whole Milk (1L)", price: 50, category: "Dairy & Eggs", subcategory: "Milk & Cream", brand: "FarmFresh", image: "https://via.placeholder.com/240x240.png?text=Whole+Milk", image_url: "https://via.placeholder.com/240x240.png?text=Whole+Milk", sku: "FM-001", barcode: "890000000001", stock: 12, unit: "1L", description: "Full fat whole milk." },
    { id: "d_002", name: "Skimmed Milk (1L)", price: 55, category: "Dairy & Eggs", subcategory: "Milk & Cream", brand: "DailyPure", image: "https://via.placeholder.com/240x240.png?text=Skimmed+Milk", image_url: "https://via.placeholder.com/240x240.png?text=Skimmed+Milk", sku: "DP-002", barcode: "890000000002", stock: 8, unit: "1L", description: "Low fat skimmed milk." },
    { id: "d_003", name: "Greek Yogurt (150g)", price: 65, category: "Dairy & Eggs", subcategory: "Milk & Cream", brand: "Yummi", image: "https://via.placeholder.com/240x240.png?text=Greek+Yogurt", image_url: "https://via.placeholder.com/240x240.png?text=Greek+Yogurt", sku: "YG-003", barcode: "890000000003", stock: 18, unit: "150g", description: "Creamy Greek yogurt." },
    { id: "d_004", name: "Butter (100g)", price: 70, category: "Dairy & Eggs", subcategory: "Butter & Spreads", brand: "SpreadWell", image: "https://via.placeholder.com/240x240.png?text=Butter", image_url: "https://via.placeholder.com/240x240.png?text=Butter", sku: "BW-004", barcode: "890000000004", stock: 10, unit: "100g", description: "Salted butter." },

    { id: "e_001", name: "Organic Eggs (12)", price: 160, category: "Dairy & Eggs", subcategory: "Eggs", brand: "HappyEgg", image: "https://via.placeholder.com/240x240.png?text=Organic+Eggs", image_url: "https://via.placeholder.com/240x240.png?text=Organic+Eggs", sku: "OE-001", barcode: "890000000105", stock: 14, unit: "12pcs", description: "Organic farm eggs (12 pcs)." },
    { id: "e_002", name: "Brown Eggs (12)", price: 140, category: "Dairy & Eggs", subcategory: "Eggs", brand: "HappyEgg", image: "https://via.placeholder.com/240x240.png?text=Brown+Eggs", image_url: "https://via.placeholder.com/240x240.png?text=Brown+Eggs", sku: "BE-002", barcode: "890000000106", stock: 18, unit: "12pcs", description: "Natural brown eggs (12 pcs)." },
    { id: "e_003", name: "Free-range Eggs (12)", price: 170, category: "Dairy & Eggs", subcategory: "Eggs", brand: "FreeFarm", image: "https://via.placeholder.com/240x240.png?text=Free-range+Eggs", image_url: "https://via.placeholder.com/240x240.png?text=Free-range+Eggs", sku: "FR-003", barcode: "890000000107", stock: 10, unit: "12pcs", description: "Free-range eggs (12 pcs)." },

    { id: "c_001", name: "Cheddar Cheese (200g)", price: 220, category: "Dairy & Eggs", subcategory: "Cheese", brand: "Cheesy", image: "https://via.placeholder.com/240x240.png?text=Cheddar+Cheese", image_url: "https://via.placeholder.com/240x240.png?text=Cheddar+Cheese", sku: "CH-001", barcode: "890000010001", stock: 12, unit: "200g", description: "Aged cheddar cheese." },
    { id: "c_002", name: "Mozzarella (200g)", price: 240, category: "Dairy & Eggs", subcategory: "Cheese", brand: "MeltWell", image: "https://via.placeholder.com/240x240.png?text=Mozzarella", image_url: "https://via.placeholder.com/240x240.png?text=Mozzarella", sku: "MZ-002", barcode: "890000010002", stock: 10, unit: "200g", description: "Soft mozzarella for melting." },
    { id: "c_003", name: "Feta Cheese (150g)", price: 200, category: "Dairy & Eggs", subcategory: "Cheese", brand: "GreekDel", image: "https://via.placeholder.com/240x240.png?text=Feta", image_url: "https://via.placeholder.com/240x240.png?text=Feta", sku: "FT-003", barcode: "890000010003", stock: 6, unit: "150g", description: "Tangy feta cheese." },

    // Chocolates varieties added under Dairy & Eggs -> Chocolates
    { id: "ch_001", name: "Milk Chocolate Bar (50g)", price: 40, category: "Dairy & Eggs", subcategory: "Chocolates", brand: "ChocoDelight", image: "https://via.placeholder.com/240x240.png?text=Milk+Chocolate", image_url: "https://via.placeholder.com/240x240.png?text=Milk+Chocolate", sku: "MC-001", barcode: "890000070001", stock: 50, unit: "50g", description: "Smooth milk chocolate bar." },
    { id: "ch_002", name: "Dark Chocolate (70% - 50g)", price: 60, category: "Dairy & Eggs", subcategory: "Chocolates", brand: "BitterBean", image: "https://via.placeholder.com/240x240.png?text=Dark+Chocolate", image_url: "https://via.placeholder.com/240x240.png?text=Dark+Chocolate", sku: "DC-002", barcode: "890000070002", stock: 30, unit: "50g", description: "Rich 70% cocoa dark chocolate." },
    { id: "ch_003", name: "Chocolate Assorted Box (12pcs)", price: 450, category: "Dairy & Eggs", subcategory: "Chocolates", brand: "ChocoBox", image: "https://via.placeholder.com/240x240.png?text=Assorted+Chocolates", image_url: "https://via.placeholder.com/240x240.png?text=Assorted+Chocolates", sku: "CBX-003", barcode: "890000070003", stock: 12, unit: "12pcs", description: "Assorted filled chocolates - perfect for gifting." },
    { id: "ch_004", name: "Hazelnut Chocolate Spread (200g)", price: 180, category: "Dairy & Eggs", subcategory: "Chocolates", brand: "SpreadWell", image: "https://via.placeholder.com/240x240.png?text=Hazelnut+Spread", image_url: "https://via.placeholder.com/240x240.png?text=Hazelnut+Spread", sku: "HS-004", barcode: "890000070004", stock: 20, unit: "200g", description: "Creamy hazelnut chocolate spread." },

    { id: "v_l_001", name: "Spinach (250g)", price: 30, category: "Vegetables", subcategory: "Leafy", brand: "GreenLeaf", image: "https://via.placeholder.com/240x240.png?text=Spinach", image_url: "https://via.placeholder.com/240x240.png?text=Spinach", sku: "SP-001", barcode: "890000020001", stock: 30, unit: "250g", description: "Fresh spinach leaves." },
    { id: "v_l_002", name: "Lettuce (1pc)", price: 45, category: "Vegetables", subcategory: "Leafy", brand: "GreenLeaf", image: "https://via.placeholder.com/240x240.png?text=Lettuce", image_url: "https://via.placeholder.com/240x240.png?text=Lettuce", sku: "LT-002", barcode: "890000020002", stock: 22, unit: "1pc", description: "Crisp lettuce." },
    { id: "v_r_001", name: "Potatoes (1kg)", price: 40, category: "Vegetables", subcategory: "Root", brand: "RootFarm", image: "https://via.placeholder.com/240x240.png?text=Potatoes", image_url: "https://via.placeholder.com/240x240.png?text=Potatoes", sku: "PT-001", barcode: "890000020011", stock: 50, unit: "1kg", description: "Red potatoes." },
    { id: "v_r_002", name: "Carrots (1kg)", price: 80, category: "Vegetables", subcategory: "Root", brand: "RootFarm", image: "https://via.placeholder.com/240x240.png?text=Carrots", image_url: "https://via.placeholder.com/240x240.png?text=Carrots", sku: "CR-002", barcode: "890000020012", stock: 12, unit: "1kg", description: "Crunchy orange carrots." },
    { id: "v_r_003", name: "Onions (1kg)", price: 60, category: "Vegetables", subcategory: "Root", brand: "RootFarm", image: "https://via.placeholder.com/240x240.png?text=Onions", image_url: "https://via.placeholder.com/240x240.png?text=Onions", sku: "ON-003", barcode: "890000020013", stock: 45, unit: "1kg", description: "Yellow onions." },
    { id: "v_s_001", name: "Broccoli (500g)", price: 120, category: "Vegetables", subcategory: "Stems", brand: "VeggieBox", image: "https://via.placeholder.com/240x240.png?text=Broccoli", image_url: "https://via.placeholder.com/240x240.png?text=Broccoli", sku: "BR-001", barcode: "890000020021", stock: 12, unit: "500g", description: "Fresh broccoli." },
    { id: "v_s_002", name: "Zucchini (1pc)", price: 65, category: "Vegetables", subcategory: "Stems", brand: "VeggieBox", image: "https://via.placeholder.com/240x240.png?text=Zucchini", image_url: "https://via.placeholder.com/240x240.png?text=Zucchini", sku: "ZC-002", barcode: "890000020022", stock: 14, unit: "1pc", description: "Green zucchini." },
    { id: "v_m_001", name: "Mixed Veg Pack (500g)", price: 140, category: "Vegetables", subcategory: "Mixed Veg", brand: "MixFarm", image: "https://via.placeholder.com/240x240.png?text=Mixed+Veg+Pack", image_url: "https://via.placeholder.com/240x240.png?text=Mixed+Veg+Pack", sku: "MV-001", barcode: "890000020031", stock: 20, unit: "500g", description: "Carrots, peas, beans mix." },
    { id: "v_m_002", name: "Bell Peppers (3pcs)", price: 150, category: "Vegetables", subcategory: "Mixed Veg", brand: "ColorFarm", image: "https://via.placeholder.com/240x240.png?text=Bell+Peppers", image_url: "https://via.placeholder.com/240x240.png?text=Bell+Peppers", sku: "BP-002", barcode: "890000020032", stock: 18, unit: "3pcs", description: "Red, yellow, green peppers." },

    { id: "f_c_001", name: "Oranges (1kg)", price: 120, category: "Fruits", subcategory: "Citrus", brand: "CitrusCo", image: "https://via.placeholder.com/240x240.png?text=Oranges", image_url: "https://via.placeholder.com/240x240.png?text=Oranges", sku: "OR-001", barcode: "890000030001", stock: 15, unit: "1kg", description: "Juicy oranges." },
    { id: "f_c_002", name: "Lemons (500g)", price: 70, category: "Fruits", subcategory: "Citrus", brand: "CitrusCo", image: "https://via.placeholder.com/240x240.png?text=Lemons", image_url: "https://via.placeholder.com/240x240.png?text=Lemons", sku: "LM-002", barcode: "890000030002", stock: 25, unit: "500g", description: "Fresh lemons." },
    { id: "f_b_001", name: "Strawberries (250g)", price: 220, category: "Fruits", subcategory: "Berries", brand: "BerryGood", image: "https://via.placeholder.com/240x240.png?text=Strawberries", image_url: "https://via.placeholder.com/240x240.png?text=Strawberries", sku: "SB-001", barcode: "890000030011", stock: 10, unit: "250g", description: "Sweet strawberries." },
    { id: "f_b_002", name: "Blueberries (125g)", price: 260, category: "Fruits", subcategory: "Berries", brand: "BerryGood", image: "https://via.placeholder.com/240x240.png?text=Blueberries", image_url: "https://via.placeholder.com/240x240.png?text=Blueberries", sku: "BB-002", barcode: "890000030012", stock: 8, unit: "125g", description: "Fresh blueberries." },
    { id: "f_t_001", name: "Mango (1pc)", price: 90, category: "Fruits", subcategory: "Tropical", brand: "Tropico", image: "https://via.placeholder.com/240x240.png?text=Mango", image_url: "https://via.placeholder.com/240x240.png?text=Mango", sku: "MG-001", barcode: "890000030021", stock: 25, unit: "1pc", description: "Ripe mango." },
    { id: "f_t_002", name: "Bananas (1 dozen)", price: 60, category: "Fruits", subcategory: "Tropical", brand: "Tropico", image: "https://via.placeholder.com/240x240.png?text=Bananas", image_url: "https://via.placeholder.com/240x240.png?text=Bananas", sku: "BN-002", barcode: "890000030022", stock: 20, unit: "1dz", description: "Sweet bananas." },

    { id: "b_br_001", name: "Wheat Bread", price: 150, category: "Bakery", subcategory: "Bread", brand: "BakeHouse", image: "https://via.placeholder.com/240x240.png?text=Wheat+Bread", image_url: "https://via.placeholder.com/240x240.png?text=Wheat+Bread", sku: "WB-001", barcode: "890000040001", stock: 15, unit: "1pc", description: "Fresh baked wheat bread." },
    { id: "b_p_001", name: "Croissant", price: 45, category: "Bakery", subcategory: "Pastries", brand: "BakeHouse", image: "https://via.placeholder.com/240x240.png?text=Croissant", image_url: "https://via.placeholder.com/240x240.png?text=Croissant", sku: "CR-001", barcode: "890000040011", stock: 25, unit: "1pc", description: "Buttery croissant." },
    { id: "b_p_002", name: "Danish Pastry", price: 95, category: "Bakery", subcategory: "Pastries", brand: "PastryPros", image: "https://via.placeholder.com/240x240.png?text=Danish+Pastry", image_url: "https://via.placeholder.com/240x240.png?text=Danish+Pastry", sku: "DP-002", barcode: "890000040012", stock: 18, unit: "1pc", description: "Fruit filled danish." },
    { id: "b_c_001", name: "Chocolate Cake (slice)", price: 200, category: "Bakery", subcategory: "Cakes", brand: "SweetBakes", image: "https://via.placeholder.com/240x240.png?text=Chocolate+Cake", image_url: "https://via.placeholder.com/240x240.png?text=Chocolate+Cake", sku: "CC-001", barcode: "890000040021", stock: 6, unit: "slice", description: "Rich chocolate slice." },
    { id: "b_c_002", name: "Vanilla Cake (slice)", price: 190, category: "Bakery", subcategory: "Cakes", brand: "SweetBakes", image: "https://via.placeholder.com/240x240.png?text=Vanilla+Cake", image_url: "https://via.placeholder.com/240x240.png?text=Vanilla+Cake", sku: "VC-002", barcode: "890000040022", stock: 6, unit: "slice", description: "Classic vanilla cake." },

    { id: "m_po_001", name: "Chicken Breast (500g)", price: 240, category: "Meat & Seafood", subcategory: "Poultry", brand: "Butcher's", image: "https://via.placeholder.com/240x240.png?text=Chicken+Breast", image_url: "https://via.placeholder.com/240x240.png?text=Chicken+Breast", sku: "CB-001", barcode: "890000050001", stock: 10, unit: "500g", description: "Boneless chicken breast." },
    { id: "m_po_002", name: "Chicken Thighs (500g)", price: 220, category: "Meat & Seafood", subcategory: "Poultry", brand: "Butcher's", image: "https://via.placeholder.com/240x240.png?text=Chicken+Thighs", image_url: "https://via.placeholder.com/240x240.png?text=Chicken+Thighs", sku: "CT-002", barcode: "890000050002", stock: 12, unit: "500g", description: "Skin-on chicken thighs." },
    { id: "m_bf_001", name: "Beef Steak (250g)", price: 420, category: "Meat & Seafood", subcategory: "Beef", brand: "PrimeCuts", image: "https://via.placeholder.com/240x240.png?text=Beef+Steak", image_url: "https://via.placeholder.com/240x240.png?text=Beef+Steak", sku: "BS-001", barcode: "890000050011", stock: 6, unit: "250g", description: "Prime beef steak." },
    { id: "s_001", name: "Prawns (250g)", price: 360, category: "Meat & Seafood", subcategory: "Seafood", brand: "SeaBest", image: "https://via.placeholder.com/240x240.png?text=Prawns+250g", image_url: "https://via.placeholder.com/240x240.png?text=Prawns+250g", sku: "PR-001", barcode: "890000060001", stock: 8, unit: "250g", description: "Fresh prawns." },
    { id: "s_002", name: "Salmon Fillet (250g)", price: 320, category: "Meat & Seafood", subcategory: "Seafood", brand: "SeaBest", image: "https://via.placeholder.com/240x240.png?text=Salmon+Fillet", image_url: "https://via.placeholder.com/240x240.png?text=Salmon+Fillet", sku: "SF-002", barcode: "890000060002", stock: 6, unit: "250g", description: "Atlantic salmon fillet." },
  ];

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const pResp = await fetchWithToken("/api/product").catch(() => null);
        const productsList: any[] = pResp?.data || pResp || [];
        const oResp = await fetchWithToken("/api/orders").catch(() => null);
        const ordersList: any[] = oResp?.data || oResp || [];
        const nResp: any = await fetchNotifications().catch(() => null);
        const notifs: any[] = (nResp?.data || nResp || []) as any[];
        if (!mounted) return;

        const mappedProducts: Product[] = productsList?.length
          ? productsList.map((p: any) => ({
              id: p.id ?? p.productId ?? p.sku ?? Math.random().toString(36).slice(2, 9),
              name: p.name ?? p.productName ?? "Unnamed",
              price: typeof p.price === "number" ? p.price : Number(p.price) || 0,
              category: p.categoryName || p.category || p.mainCategory || (p.category_id ? String(p.category_id) : "Uncategorized"),
              subcategory: p.subcategory || p.category_sub || p.subCategory || undefined,
              brand: p.brand ?? p.manufacturer ?? p.brandName ?? undefined,
              image: p.image ?? p.image_url ?? "",
              image_url: p.image_url ?? p.image ?? "",
              stock: typeof p.stock === "number" ? p.stock : Number(p.stock) || 0,
              unit: p.unit ?? p.sku ?? "",
              barcode: p.barcode ?? p.upc ?? undefined,
              sku: p.sku ?? undefined,
              description: p.description ?? undefined,
            }))
          : [];
        setProducts(mappedProducts);

        // keep API categories if available
        setCategoriesFromApi(Array.from(new Set(mappedProducts.map((p) => p.category || "Uncategorized"))));

        const mappedOrders: OrderSummary[] = ordersList?.length
          ? ordersList
              .slice()
              .reverse()
              .slice(0, 20)
              .map((o: any) => ({
                id: o.id ?? o.orderId,
                customerName: o.customerName ?? (o.customer && o.customer.name) ?? `#${o.id}`,
                totalItems: o.totalItems ?? (o.items && o.items.length) ?? 0,
                totalAmount: o.totalAmount ?? o.total_amount ?? 0,
                created_at: o.created_at ?? o.createdAt ?? new Date().toISOString(),
              }))
          : [];
        setRecentOrders(mappedOrders);

        setNotifications(Array.isArray(notifs) && notifs.length ? notifs : []);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // match API/main category text to chip categories
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

  // subcategory matching uses explicit product.subcategory when present
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
      if (s.includes("chocolate") || s.includes("chocolates") || s.includes("cocoa") || s.includes("hazelnut") || s.includes("dark") || s.includes("milk chocolate")) {
        return name.includes("chocolate") || name.includes("chocolates") || name.includes("cocoa") || name.includes("hazelnut") || name.includes("dark") || name.includes("milk chocolate") || subcat.includes("chocolate") || subcat.includes("chocolates");
      }
      return name.includes(s) || cat.includes(s);
    }
    return false;
  }

  function productsForSubcategory(sub: string) {
    return visibleProducts.filter((p) => subcategoryMatches(p, sub, selectedCategory));
  }

  const brands = useMemo(() => {
    const b = new Set<string>();
    [...products, ...demoProducts].forEach((p) => {
      if (p.brand) b.add(String(p.brand));
    });
    return ["All Brands", ...Array.from(b).sort()];
  }, [products]);

  const visibleProducts = useMemo(() => {
    const apiProducts = products || [];
    const demos = demoProducts || [];

    const categoryFiltered =
      selectedCategory === "All products"
        ? [...apiProducts, ...demos]
        : [
            ...apiProducts.filter((p) => categoryMatches(p.category, selectedCategory)),
            ...demos.filter((d) => categoryMatches(d.category, selectedCategory)),
          ];

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

  // auto-scroll product list when new products added
  useEffect(() => {
    const cur = productsRef.current;
    const prev = prevVisibleCount.current;
    const curLen = visibleProducts.length;
    if (cur && curLen > prev) {
      cur.scrollTo({ left: cur.scrollWidth - cur.clientWidth, behavior: "smooth" });
    }
    prevVisibleCount.current = curLen;
  }, [visibleProducts]);

  // Continuous looped auto-scroll for "All products"
  useEffect(() => {
    const el = productsRef.current;
    if (!el || selectedCategory !== "All products") return;

    const clearUserTimeout = () => {
      if (userInteractTimeout.current) {
        window.clearTimeout(userInteractTimeout.current);
        userInteractTimeout.current = null;
      }
    };

    // pause only on explicit interactions
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

    // render is duplicated in DOM; set start in the middle to avoid jump
    const half = Math.floor(el.scrollWidth / 2);
    if (el.scrollWidth > el.clientWidth) el.scrollLeft = half;

    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const curEl = productsRef.current;
      if (!curEl) return;
      const dt = now - last;
      last = now;
      if (!autoScrollPaused && curEl.scrollWidth > curEl.clientWidth) {
        const move = pxPerFrame * (dt / 16.6667); // scale by frame time (60fps baseline)
        if (scrollDirection === "left") {
          curEl.scrollLeft -= move;
          if (curEl.scrollLeft <= 0) {
            // jump forward by half content width (keeps seamless loop)
            curEl.scrollLeft += half;
          }
        } else {
          curEl.scrollLeft += move;
          if (curEl.scrollLeft >= curEl.scrollWidth - curEl.clientWidth) {
            curEl.scrollLeft -= half;
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

  // auto-scroll cart
  useEffect(() => {
    const prev = prevCartCount.current;
    const cur = cartRef.current;
    if (cur && cart.length > prev && cart.length > 2) {
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
      await createBill({ order, items });
      setCart([]);
      alert("Checkout successful");
    } catch {
      alert("Checkout failed");
    }
  }

  const qtyInCart = (productId: string | number) => {
    const it = cart.find((c) => c.product.id === productId);
    return it ? it.qty : 0;
  };

  // product horizontal nav
  const PROD_STEP = 340;
  function scrollProducts(direction: "left" | "right", ref?: React.RefObject<HTMLDivElement>) {
    const el = (ref && ref.current) || productsRef.current;
    if (!el) return;
    const delta = direction === "left" ? -PROD_STEP : PROD_STEP;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }
  // billing vertical nav
  const BILL_STEP = 240;
  function scrollBilling(direction: "up" | "down") {
    const el = billingRef.current;
    if (!el) return;
    const delta = direction === "up" ? -BILL_STEP : BILL_STEP;
    el.scrollBy({ top: delta, behavior: "smooth" });
  }

  // helper to update a single subcategory nav state
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

  // scroll a specific subcategory list
  const SUBCAT_STEP = 340;
  function scrollSubcat(sub: string, direction: "left" | "right") {
    const el = subcatRefs.current[sub];
    if (!el) return;
    const delta = direction === "left" ? -SUBCAT_STEP : SUBCAT_STEP;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }

  // update nav enable/disable states
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

  // watch subcategory containers and update their nav states
  useEffect(() => {
    const subs = subcategoryMap[selectedCategory] || [];
    const cleanupFns: Array<() => void> = [];
    subs.forEach((sub) => {
      const el = subcatRefs.current[sub];
      if (!el) return;
      const onScroll = () => updateSubcatNav(sub);
      el.addEventListener("scroll", onScroll);
      window.addEventListener("resize", onScroll);
      // initial update
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
            {/* Products + billing history */}
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
                        {/* direction controls */}
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
                              <>
                                {visibleProducts.map((p) => {
                                  const qty = qtyInCart(p.id);
                                  const isDemo =
                                    String(p.id).startsWith("d_") ||
                                    String(p.id).startsWith("e_") ||
                                    String(p.id).startsWith("v_") ||
                                    String(p.id).startsWith("f_") ||
                                    String(p.id).startsWith("b_") ||
                                    String(p.id).startsWith("m_") ||
                                    String(p.id).startsWith("c_") ||
                                    String(p.id).startsWith("s_") ||
                                    String(p.id).startsWith("ch_");
                                  return (
                                    <div
                                      key={p.id}
                                      className={`flex-shrink-0 min-w-[160px] p-3 bg-white rounded shadow-sm flex flex-col items-center ${isDemo ? "opacity-95" : ""}`}
                                    >
                                      <img src={p.image || p.image_url || "/images/placeholder.png"} alt={p.name} className="h-20 object-contain mb-2" />
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
                                })}
                                {/* duplicate sequence for seamless loop — duplicates now include controls too */}
                                {visibleProducts.map((p) => {
                                  const qty = qtyInCart(p.id);
                                  const isDemo =
                                    String(p.id).startsWith("d_") ||
                                    String(p.id).startsWith("e_") ||
                                    String(p.id).startsWith("v_") ||
                                    String(p.id).startsWith("f_") ||
                                    String(p.id).startsWith("b_") ||
                                    String(p.id).startsWith("m_") ||
                                    String(p.id).startsWith("c_") ||
                                    String(p.id).startsWith("s_") ||
                                    String(p.id).startsWith("ch_");
                                  return (
                                    <div
                                      key={`${p.id}-dup`}
                                      className={`flex-shrink-0 min-w-[160px] p-3 bg-white rounded shadow-sm flex flex-col items-center ${isDemo ? "opacity-95" : ""}`}
                                    >
                                      <img src={p.image || p.image_url || "/images/placeholder.png"} alt={p.name} className="h-20 object-contain mb-2" />
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
                                          aria-label={`decrease-${p.id}-dup`}
                                        >
                                          -
                                        </button>
                                        <span className="px-2 text-xs font-semibold">{qty}</span>
                                        <button
                                          onClick={() => addToCart(p, 1)}
                                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                                          aria-label={`increase-${p.id}-dup`}
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
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
                                        const isDemo = String(p.id).startsWith("d_") || String(p.id).startsWith("e_") || String(p.id).startsWith("v_") || String(p.id).startsWith("f_") || String(p.id).startsWith("b_") || String(p.id).startsWith("m_") || String(p.id).startsWith("c_") || String(p.id).startsWith("s_") || String(p.id).startsWith("ch_");
                                        return (
                                          <div
                                            key={p.id}
                                            className={`flex-shrink-0 min-w-[160px] p-3 bg-gray-50 rounded shadow-sm flex flex-col items-center ${isDemo ? "opacity-95" : ""}`}
                                          >
                                            <img src={p.image || p.image_url || "/images/placeholder.png"} alt={p.name} className="h-20 object-contain mb-2" />
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

              {/* Billing history */}
              <div className="bg-white rounded-2xl shadow p-4 relative">
                <div className="flex items-center flex-wrap justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaReceipt className="text-blue-700" size={18} aria-hidden />
                    <h3 className="text-base font-semibold text-blue-900">Billing History</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-800 font-semibold">Today</span>
                  </div>
                </div>

                <div className="relative">
                  <button
                    aria-label="billing-up"
                    onClick={() => scrollBilling("up")}
                    disabled={!canScrollUpBill}
                    className={`absolute right-8 top-4 z-40 p-2 rounded-full bg-white border text-blue-700 shadow ${canScrollUpBill ? "" : "opacity-40 cursor-not-allowed"}`}
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
                    ) : recentOrders.length === 0 ? (
                      <div className="text-xs text-gray-700">No recent orders</div>
                    ) : (
                      recentOrders.map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded p-3 border bg-gray-100">
                          <div className="flex items-center gap-2">
                            <img src="/images/user-placeholder.png" className="h-8 w-8 rounded-full border" alt="user" />
                            <div>
                              <div className="text-sm font-semibold text-blue-800">{o.customerName || `#${o.id}`}</div>
                              <div className="text-xs text-gray-700">#{o.id}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-700">Items: {o.totalItems ?? 0}</div>
                            <div className="text-xs font-semibold text-blue-800">Rs. {o.totalAmount ?? 0}</div>
                          </div>
                          <button className="px-2 py-1 text-xs rounded text-blue-500">▼</button>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    aria-label="billing-down"
                    onClick={() => scrollBilling("down")}
                    disabled={!canScrollDownBill}
                    className={`absolute right-8 bottom-4 z-20 p-2 rounded-full bg-white border text-blue-700 shadow ${canScrollDownBill ? "" : "opacity-40 cursor-not-allowed"}`}
                  >
                    <FaChevronDown />
                  </button>
                </div>
              </div>
            </section>

            {/* Cart / actions column */}
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
                  className={` ${cart.length > 2 ? "no-scrollbar overflow-y-auto" : "overflow-visible"} `}
                  style={{ maxHeight: cart.length > 2 ? 300 : "auto", transition: "max-height 200ms ease" }}
                >
                  {cart.length === 0 ? (
                    <div className="text-sm text-gray-700">Cart is empty</div>
                  ) : (
                    cart.map((it) => (
                      <div key={it.product.id} className="flex items-center gap-3 py-1">
                        <img
                          src={it.product.image || it.product.image_url || "/images/placeholder.png"}
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
                  <button onClick={() => handleCheckout("CARD")} className="px-3 py-2 text-sm bg-white border text-blue-600 font-semibold rounded">CARD</button>
                  <button onClick={() => handleCheckout("LOYALTY")} className="px-3 py-2 text-sm bg-blue-500 text-white font-semibold rounded">LOYALTY</button>
                </div>

                <button className="mt-2 w-full px-3 py-2 text-sm bg-blue-400 text-white font-semibold rounded">DIGITAL WALLET</button>

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
              onBillCreated={() => {
                setShowCreateBill(false);
                setCart([]);
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