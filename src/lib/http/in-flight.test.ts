import { describe, expect, it, vi } from "vitest";

import { InFlightCoalescer } from "./in-flight";

describe("InFlightCoalescer", () => {
  it("shares an active load and identifies only its owner", async () => {
    const coalescer = new InFlightCoalescer<string>();
    let release!: (value: string) => void;
    const loader = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );

    const first = coalescer.run("same", loader);
    const second = coalescer.run("same", loader);
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    release("result");

    await expect(first).resolves.toEqual({ owner: true, value: "result" });
    await expect(second).resolves.toEqual({ owner: false, value: "result" });
  });

  it("removes failed and completed loads so later requests can retry", async () => {
    const coalescer = new InFlightCoalescer<number>();
    await expect(
      coalescer.run("key", async () => {
        throw new Error("failed");
      }),
    ).rejects.toThrow("failed");

    await expect(coalescer.run("key", async () => 2)).resolves.toEqual({
      owner: true,
      value: 2,
    });
  });
});
