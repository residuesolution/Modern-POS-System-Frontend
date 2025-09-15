"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { apiConfig } from "../../config/apiConfig";

export default function HelpPage() {
  const [helpContent, setHelpContent] = useState<any[]>([]);
  useEffect(() => {
    axios.get(`${apiConfig.baseUrl}/api/help`)
      .then(res => setHelpContent(res.data))
      .catch(() => setHelpContent([]));
  }, []);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Help & Support</h1>
      {helpContent.length === 0 ? (
        <p>No help articles found.</p>
      ) : (
        <ul>
          {helpContent.map((item, idx) => (
            <li key={idx} className="mb-4">
              <h2 className="font-semibold">{item.title}</h2>
              <p>{item.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}