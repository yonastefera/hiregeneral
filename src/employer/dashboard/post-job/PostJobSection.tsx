type PostJobSectionProps = {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
};

export function PostJobSection({
  title,
  description,
  icon: Icon,
  children,
}: PostJobSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="mb-4 flex items-start gap-2.5">
        {Icon ? (
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 text-emerald-600">
            <Icon className="h-3.5 w-3.5" />
          </div>
        ) : null}

        <div>
          <h2 className="text-[14px] font-semibold">{title}</h2>

          {description ? (
            <p className="mt-0.5 text-[11px] text-neutral-500">{description}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  );
}
