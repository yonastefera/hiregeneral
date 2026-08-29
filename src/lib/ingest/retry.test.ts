import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";

describe("withRetry", () => {
  it("returns the successful attempt count", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary"))
      .mockResolvedValueOnce("ok");
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(withRetry(operation, { sleep })).resolves.toEqual({
      value: "ok",
      attempts: 2,
    });
    expect(sleep).toHaveBeenCalledWith(500);
  });

  it("stops after the configured attempts", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(
      withRetry(operation, {
        policy: { maxAttempts: 2 },
        sleep: vi.fn().mockResolvedValue(undefined),
      }),
    ).rejects.toThrow("offline");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry permanent failures", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("invalid"));

    await expect(
      withRetry(operation, { shouldRetry: () => false }),
    ).rejects.toThrow("invalid");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
