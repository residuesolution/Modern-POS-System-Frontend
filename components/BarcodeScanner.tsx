"use client";
import { useRef } from "react";
import { fetchProductByBarcode } from "../services/authService";

export default function BarcodeScanner({ onProduct }: { onProduct: (product: any) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (barcode: string) => {
    if (!barcode) return;
    try {
      const product = await fetchProductByBarcode(barcode);
      onProduct(product);
    } catch {
      alert("Product not found!");
    }
  };

  return (
    <div className="mb-4">
      <input
        ref={inputRef}
        type="text"
        placeholder="Scan barcode here..."
        className="border px-3 py-2 rounded-lg w-64"
        onKeyDown={e => {
          if (e.key === "Enter" && inputRef.current) {
            handleScan(inputRef.current.value);
            inputRef.current.value = "";
          }
        }}
        onFocus={e => e.target.select()}
      />
    </div>
  );
}