export function jsonRequest(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: unknown,
  headers?: HeadersInit,
) {
  return new Request(`https://www.hiregeneral.com${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
