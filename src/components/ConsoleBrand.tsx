"use client";

import { useEffect } from "react";

export default function ConsoleBrand() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const logo = `
      ██╗  ██╗██╗██████╗ ███████╗
      ██║  ██║██║██╔══██╗██╔════╝
      ███████║██║██████╔╝█████╗
      ██╔══██║██║██╔══██╗██╔══╝
      ██║  ██║██║██║  ██║███████╗
      ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

      ██████╗ ███████╗███╗   ██╗███████╗██████╗  █████╗ ██╗
      ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔══██╗██╔══██╗██║
      ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██████╔╝███████║██║
      ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██╗██╔══██║██║
      ╚██████╔╝███████╗██║ ╚████║███████╗██║  ██║██║  ██║███████╗
      ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
    `;

    console.log(
      `%c${logo}`,
      [
        "color:#10b8b8",
        "font-family:monospace",
        "font-weight:800",
        "font-size:12px",
        "line-height:1.08",
      ].join(";"),
    );

    console.log(
      "%cHire%cGeneral",
      "color:#0f172a;font-weight:800;font-size:18px;",
      "color:#0891b2;font-weight:800;font-size:18px;",
    );

    console.log(
      "%cSearch smarter. %cHire faster. %cMove with HireGeneral.",
      "color:#0f172a;font-weight:700;font-size:13px;",
      "color:#10b8b8;font-weight:700;font-size:13px;",
      "color:#0f172a;font-weight:700;font-size:13px;",
    );

    console.log(
      "%cA minimal job board for candidates and recruiters.",
      "color:#64748b;font-size:12px;",
    );

    console.log(
      "%cFind jobs: https://www.hiregeneral.com",
      "color:#0891b2;font-size:12px;",
    );

    console.log(
      "%cPost a job: https://www.hiregeneral.com/employers",
      "color:#f97316;font-size:12px;",
    );

    console.log(
      "%cSecurity reminder: Do not paste code here unless you understand exactly what it does.",
      "color:#f97316;font-weight:600;font-size:12px;",
    );
  }, []);

  return null;
}
