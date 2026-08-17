import { writeRedactedLog } from "@/lib/logging/redact";

export type ErrorCategory =
  | "authentication"
  | "authorization"
  | "database"
  | "external_provider"
  | "rate_limit"
  | "validation"
  | "unknown";

export type OperationContext = {
  operation: string;
  route: string;
  requestId: string;
  userId?: string;
  externalProvider?: string;
};

export function requestId(request: Request) {
  return (
    request.headers.get("x-request-id")?.trim().slice(0, 128) ||
    crypto.randomUUID()
  );
}

export function startOperation(
  request: Request,
  context: Omit<OperationContext, "requestId">,
) {
  const startedAt = performance.now();
  const operationContext: OperationContext = {
    ...context,
    requestId: requestId(request),
  };

  return {
    context: operationContext,
    success(metadata: Record<string, unknown> = {}) {
      writeRedactedLog("info", "operation_completed", {
        ...operationContext,
        durationMs: Math.round(performance.now() - startedAt),
        ...metadata,
      });
    },
    failure(
      category: ErrorCategory,
      error: unknown,
      metadata: Record<string, unknown> = {},
    ) {
      writeRedactedLog("error", "operation_failed", {
        ...operationContext,
        errorCategory: category,
        durationMs: Math.round(performance.now() - startedAt),
        error,
        ...metadata,
      });
    },
    metric(name: string, value = 1, metadata: Record<string, unknown> = {}) {
      writeRedactedLog("info", "metric", {
        ...operationContext,
        metric: name,
        value,
        ...metadata,
      });
    },
  };
}

export function withRequestId(response: Response, id: string) {
  response.headers.set("x-request-id", id);
  return response;
}
