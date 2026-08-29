export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

export type RetryResult<T> = {
  value: T;
  attempts: number;
};

const DEFAULT_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 5_000,
};

function retryDelay(attempt: number, policy: RetryPolicy) {
  return Math.min(
    policy.baseDelayMs * 2 ** Math.max(0, attempt - 1),
    policy.maxDelayMs,
  );
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options?: {
    policy?: Partial<RetryPolicy>;
    shouldRetry?: (error: unknown) => boolean;
    sleep?: (delayMs: number) => Promise<void>;
  },
): Promise<RetryResult<T>> {
  const policy = { ...DEFAULT_POLICY, ...options?.policy };

  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1) {
    throw new Error("Retry maxAttempts must be a positive integer");
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    try {
      return { value: await operation(attempt), attempts: attempt };
    } catch (error) {
      lastError = error;

      if (
        attempt >= policy.maxAttempts ||
        options?.shouldRetry?.(error) === false
      ) {
        throw error;
      }

      await (options?.sleep ?? wait)(retryDelay(attempt, policy));
    }
  }

  throw lastError;
}
