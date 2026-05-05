import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage mode="signin" />
    </Suspense>
  );
}
