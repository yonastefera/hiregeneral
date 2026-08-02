type AuthLogLevel = "error" | "info";

export function logAuthEvent(
  level: AuthLogLevel,
  event: string,
  context: Record<string, unknown> = {},
) {
  const entry = JSON.stringify({
    scope: "auth",
    event,
    ...context,
    timestamp: new Date().toISOString(),
  });

  if (level === "error") console.error(entry);
  else console.info(entry);
}
