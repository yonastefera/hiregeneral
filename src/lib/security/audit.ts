import "server-only";

import type { Json } from "@/lib/supabase/types";
import { logServerError } from "@/lib/http/api-security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function recordPrivilegedAction(params: {
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Json;
}) {
  const { error } = await createSupabaseAdminClient().rpc(
    "append_security_audit",
    {
      p_action: params.action,
      p_target_type: params.targetType,
      p_target_id: params.targetId,
      p_metadata: params.metadata ?? {},
    },
  );

  if (error) {
    logServerError("privileged_action_audit_failed", error);
  }
}
