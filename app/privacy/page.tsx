export default function PrivacyPolicyPage() {
  // Example icon for each point
  const icon = <span className="mr-2">🔒</span>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Privacy Policy
        </h1>

        <div className="space-y-5 text-gray-700 leading-relaxed text-base">
          <p>{icon}SwiftCart POS System is committed to protecting your <span className="font-semibold">personal information</span>.</p>
          <p>{icon}We collect information such as <span className="font-semibold">name, email, and account activity</span> to improve our services.</p>
          <p>{icon}Your data is stored securely and will only be used in accordance with this <span className="font-semibold">Privacy Policy</span>.</p>
          <p>{icon}We do not share your personal information with third parties except as required by law or for service delivery.</p>
          <p>{icon}You have the right to <span className="font-semibold">access, modify, or delete</span> your personal data at any time.</p>
          <p>{icon}SwiftCart POS System uses cookies and analytics tools to enhance user experience and system performance.</p>
          <p>{icon}By using our system, you consent to the collection and use of your information as described in this policy.</p>
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center border-t pt-4">
          Please review this Privacy Policy carefully. Using the SwiftCart POS System implies your agreement to its terms.
        </p>
      </div>
    </div>
  );
}
