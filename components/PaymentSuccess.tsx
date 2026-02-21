"use client";
import React from "react";

export default function PaymentSuccess({ data, onClose }: { data: any; onClose?: () => void }) {
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-sm">
      <h3 className="text-lg font-semibold mb-2">Payment successful</h3>
      <div className="text-gray-700 mb-4">
        <div className="mb-1"><strong>Payment ID:</strong> {data.paymentId}</div>
        <div className="mb-1"><strong>Order ID:</strong> {data.orderId ?? "created-after"}</div>
        <div className="mb-1"><strong>Amount:</strong> Rs. {Number(data.amount).toLocaleString()}</div>
        <div className="mb-1"><strong>Method:</strong> {data.method}</div>
      </div>
      <div className="text-right">
        <button onClick={onClose} className="px-3 py-1 bg-blue-600 text-white rounded">Done</button>
      </div>
    </div>
  );
}