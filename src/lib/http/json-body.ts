export async function readJsonBody(request: Request, maxBytes = 8_192) {
  const result = await readJsonBodyResult(request, maxBytes);
  return result.ok ? result.data : null;
}

export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: "invalid" | "too_large" };

export async function readJsonBodyResult(
  request: Request,
  maxBytes = 8_192,
): Promise<JsonBodyResult> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
