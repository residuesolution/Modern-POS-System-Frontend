"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchHelpContent, sendHelpFeedback } from "../../services/authService";

export default function HelpPage() {
  const [helpContent, setHelpContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    fetchHelpContent()
      .then((data) => setHelpContent(data as any[]))
      .catch(() => setHelpContent([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg("");
    try {
      await sendHelpFeedback({ email, feedback });
      setFeedbackMsg("Thank you for your feedback!");
      setFeedback("");
      setEmail("");
    } catch {
      setFeedbackMsg("Failed to send feedback.");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-8 text-center">Help & Support</h1>
        {loading ? (
          <div className="text-center text-blue-700">Loading...</div>
        ) : (
          <ul className="mb-8">
            {helpContent.map((item: any, idx: number) => (
              <li key={idx} className="mb-6">
                <h2 className="font-semibold text-blue-800">{item.title}</h2>
                <p className="text-gray-700">{item.content}</p>
              </li>
            ))}
          </ul>
        )}

        <form className="space-y-3" onSubmit={handleFeedback}>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email:
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 text-sm"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Send us your feedback or question:
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-500 text-sm"
            rows={3}
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            required
          />
          <button
            className="w-3/4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs block mx-auto mb-1"
            type="submit"
          >
            Submit Feedback
          </button>
          {feedbackMsg && (
            <div className="text-center text-green-600 mt-2">{feedbackMsg}</div>
          )}
        </form>
        <div className="text-center mt-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline text-xs"
          >
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}