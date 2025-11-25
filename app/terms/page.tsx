export default function TermsPage() {
  // You can use any emoji or SVG icon. Here, we use a shield emoji for illustration.
  const icon = <span className="mr-2">🛡️</span>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4097c0] via-[#91cce7] via-[#0c5875] to-[#023a50] flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-10">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Terms and Conditions
        </h1>

        <div className="space-y-5 text-gray-700 leading-relaxed text-base">
          <h3>By using <span className="font-semibold">SwiftCart POS System</span>, you agree to the following terms and conditions.</h3>
          <p>{icon}You must provide <span className="font-semibold">accurate and complete information</span> during registration.</p>
          <p>{icon}You are responsible for <span className="font-semibold">maintaining the confidentiality</span> of your account credentials.</p>
          <p>{icon}<span className="font-semibold">Unauthorized use</span> of the system is strictly prohibited.</p>
          <p>{icon}All data and content entered into the system must <span className="font-semibold">comply with applicable laws and regulations</span>.</p>
          <p>{icon}SwiftCart POS System reserves the right to <span className="font-semibold">modify or terminate services</span> at any time.</p>
          <p>{icon}Your personal information will be handled according to our <span className="font-semibold">Privacy Policy</span>.</p>
          <p>{icon}Violation of these terms may result in <span className="font-semibold">suspension or termination</span> of your account.</p>
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center border-t pt-4">
          Please read these terms carefully before using the system. If you do not agree, do not use SwiftCart POS System.
        </p>
      </div>
    </div>
  );
}