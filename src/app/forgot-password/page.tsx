import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="forgot" />
    </Suspense>
  );
}
