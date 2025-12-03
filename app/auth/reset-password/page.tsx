// app/auth/reset-password/page.tsx
import React, { Suspense } from "react";
import ResetPassword from "@/components/ResetPassword";

export const dynamic = "force-dynamic"; // disable static prerendering

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
