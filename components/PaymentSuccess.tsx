"use client";
import React from "react";

export default function PaymentSuccess({ data, onClose }: { data: any; onClose?: () => void }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Payment successful</h3>
      <div className="text-sm mb-2">
        <div>Payment ID: {data.paymentId}</div>
        <div>Order ID: {data.orderId ?? "created-after"}</div>
        <div>Amount: Rs. {data.amount}</div>
        <div>Method: {data.method}</div>
      </div>
      <div className="text-right">
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded">Close</button>
      </div>
    </div>
  );
}