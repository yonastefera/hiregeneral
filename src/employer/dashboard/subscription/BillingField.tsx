type BillingFieldProps = {
  label: string;
  children: React.ReactNode;
};

export function BillingField({ label, children }: BillingFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-neutral-600">
        {label}
      </label>

      {children}
    </div>
  );
}
