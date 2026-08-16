const normalizeCsp = (value: string) => value.replace(/\s{2,}/g, " ").trim();

export function contentSecurityPolicy(nodeEnv: string = process.env.NODE_ENV) {
  const isDevelopment = nodeEnv === "development";

  return normalizeCsp(`
    default-src 'self';
    script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.clarity.ms https://www.googletagmanager.com https://www.google-analytics.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://img.logo.dev https://*.supabase.co https://*.clarity.ms https://www.google-analytics.com https://*.google-analytics.com https://c.bing.com;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clarity.ms https://www.google-analytics.com https://*.google-analytics.com https://c.bing.com;
    frame-src 'self' https://*.supabase.co https://js.stripe.com https://hooks.stripe.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
    ${isDevelopment ? "" : "upgrade-insecure-requests;"}
  `);
}

export function phaseTwoSecurityHeaders(options?: {
  nodeEnv?: string;
  enforceCsp?: boolean;
}) {
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  const enforceCsp = options?.enforceCsp ?? process.env.CSP_ENFORCE === "true";
  const headers = [
    {
      key: enforceCsp
        ? "Content-Security-Policy"
        : "Content-Security-Policy-Report-Only",
      value: contentSecurityPolicy(nodeEnv),
    },
  ];

  if (nodeEnv === "production") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}
