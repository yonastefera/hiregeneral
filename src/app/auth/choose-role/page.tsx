import { Suspense } from "react";

import ChooseRolePage from "@/components/auth/ChooseRolePage";

export default function RoleSelectionRoute() {
  return (
    <Suspense fallback={null}>
      <ChooseRolePage />
    </Suspense>
  );
}
