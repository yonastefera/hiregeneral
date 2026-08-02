export async function readJsonBody(request: Request, maxBytes = 8_192) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
