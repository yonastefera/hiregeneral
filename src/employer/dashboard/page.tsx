export default function EmployerDashboardPage() {
  return (
    <section className="py-6">
      <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]">
        <p className="text-sm font-medium text-neutral-500">
          Employer dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
          Welcome back
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Your dashboard layout is ready. Next we can convert the overview
          cards, jobs table, candidates, messages, or whichever dashboard child
          page you send next.
        </p>
      </div>
    </section>
  );
}
