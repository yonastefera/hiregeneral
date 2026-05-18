type ResumeBlockProps = {
  heading: string;
  children: React.ReactNode;
};

export function ResumeBlock({ heading, children }: ResumeBlockProps) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
        {heading}
      </h3>

      {children}
    </section>
  );
}
