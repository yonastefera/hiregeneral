import { CreditCard, Download } from "lucide-react";

import { formatMoney, type Receipt } from "./subscription-content";

type ReceiptsTableProps = {
  receipts: Receipt[];
};

export function ReceiptsTable({ receipts }: ReceiptsTableProps) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-emerald-600">
            <CreditCard className="h-4 w-4" />
          </div>

          <h3 className="text-[14px] font-semibold">Receipts</h3>
        </div>

        <span className="text-[12px] font-medium text-neutral-400">
          Synced from Stripe
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-neutral-400">
              <th className="px-5 py-2 font-medium">Invoice</th>
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Description</th>
              <th className="px-5 py-2 font-medium">Amount</th>
              <th className="px-5 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {receipts.length === 0 ? (
              <tr className="border-t border-neutral-100">
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-[13px] text-neutral-500"
                >
                  Stripe invoices will appear here after the first successful
                  payment.
                </td>
              </tr>
            ) : null}

            {receipts.map((receipt) => (
              <tr
                key={`${receipt.invoiceNumber}-${receipt.date}`}
                className="border-t border-neutral-100"
              >
                <td className="px-5 py-3 text-[13px] font-medium">
                  {receipt.invoiceNumber}
                </td>

                <td className="px-5 py-3 text-[13px] text-neutral-600">
                  {receipt.date}
                </td>

                <td className="px-5 py-3 text-[13px] text-neutral-600">
                  {receipt.description}
                </td>

                <td className="px-5 py-3 text-[13px] font-semibold">
                  {formatMoney(receipt.amountCents, receipt.currency)}
                </td>

                <td className="px-5 py-3 text-right">
                  <a
                    href={receipt.pdfUrl || receipt.hostedUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!receipt.pdfUrl && !receipt.hostedUrl}
                    className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-medium transition hover:bg-neutral-200/60"
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
