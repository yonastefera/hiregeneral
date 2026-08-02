type AuthLogLevel = "error" | "info";

export function logAuthEvent(
  level: AuthLogLevel,
  event: string,
  context: Record<string, unknown> = {},
) {
  writeRedactedLog(level, event, { scope: "auth", ...context });
}
import { writeRedactedLog } from "@/lib/logging/redact";
