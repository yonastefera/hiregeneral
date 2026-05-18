// import Link from "next/link";
// import {
//   ArrowRight,
//   BarChart3,
//   BriefcaseBusiness,
//   Building2,
//   CalendarDays,
//   CheckCircle2,
//   Clock3,
//   FilePlus2,
//   Gauge,
//   Megaphone,
//   MessageSquare,
//   Search,
//   Sparkles,
//   UsersRound,
// } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import type {
//   EmployerDashboardData,
//   EmployerDashboardStats,
// } from "./dashboard-data";

// function formatDate(value: string) {
//   return new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//   }).format(new Date(value));
// }

// function StatCard({
//   label,
//   value,
//   icon: Icon,
// }: {
//   label: string;
//   value: number;
//   icon: typeof BriefcaseBusiness;
// }) {
//   return (
//     <article className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
//       <div className="flex items-center justify-between gap-3">
//         <div className="grid size-11 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
//           <Icon className="size-5" />
//         </div>
//         <Badge variant="soft">Live</Badge>
//       </div>
//       <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p>
//       <p className="mt-1 text-sm text-muted-foreground">{label}</p>
//     </article>
//   );
// }

// function PipelineMeter({ stats }: { stats: EmployerDashboardStats }) {
//   const total =
//     stats.activeJobs + stats.draftJobs + Math.max(1, stats.applications);
//   const activePercent = Math.min(
//     100,
//     Math.round((stats.activeJobs / total) * 100),
//   );
//   const applicationsPercent = Math.min(
//     100,
//     Math.round((stats.applications / total) * 100),
//   );

//   return (
//     <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
//       <div className="flex items-center justify-between gap-3">
//         <div>
//           <p className="text-sm font-semibold text-muted-foreground">
//             Hiring pulse
//           </p>
//           <h2 className="mt-1 text-2xl font-bold tracking-tight">
//             Pipeline health
//           </h2>
//         </div>
//         <Gauge className="size-6 text-primary" />
//       </div>

//       <div className="mt-6 space-y-4">
//         {[
//           ["Published roles", activePercent],
//           ["Applicant activity", applicationsPercent],
//           ["Company readiness", stats.companies > 0 ? 82 : 28],
//         ].map(([label, value]) => (
//           <div key={label as string}>
//             <div className="flex items-center justify-between text-sm">
//               <span className="font-medium text-foreground">{label}</span>
//               <span className="text-muted-foreground">{value}%</span>
//             </div>
//             <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
//               <div
//                 className="h-full rounded-full bg-primary-gradient"
//                 style={{ width: `${value}%` }}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// export default function EmployerDashboard({
//   data,
// }: {
//   data: EmployerDashboardData;
// }) {
//   const stats = data.stats;

//   return (
//     <main className="min-h-screen bg-background">
//       <section className="relative overflow-hidden bg-hero-gradient px-4 py-10 md:py-14">
//         <div
//           className="pointer-events-none absolute right-0 top-0 size-96 rounded-full bg-accent/10 blur-3xl"
//           aria-hidden="true"
//         />
//         <div className="relative mx-auto max-w-7xl md:px-6">
//           <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
//             <div>
//               <Badge variant="soft" className="gap-1.5">
//                 <Sparkles className="size-3.5" />
//                 Employer command center
//               </Badge>
//               <h1 className="mt-5 max-w-4xl text-balance text-5xl font-bold tracking-tight md:text-7xl">
//                 Hire with clarity, from job post to shortlist.
//               </h1>
//               <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
//                 Welcome back, {data.displayName}. Manage job posts, track
//                 applicant flow, and keep your hiring team focused on the next
//                 best action.
//               </p>
//               <div className="mt-7 flex flex-wrap gap-3">
//                 <Button size="xl" asChild>
//                   <Link href="/employers/dashboard/post-job" prefetch={false}>
//                     Post a job
//                     <ArrowRight className="size-4" />
//                   </Link>
//                 </Button>
//                 <Button variant="outline" size="xl" asChild>
//                   <Link href="/jobs" prefetch={false}>
//                     Search marketplace
//                   </Link>
//                 </Button>
//               </div>
//             </div>

//             <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-lift">
//               <div className="flex items-center gap-3">
//                 <div className="grid size-12 place-items-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-pop">
//                   <FilePlus2 className="size-6" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-semibold text-muted-foreground">
//                     Recommended next step
//                   </p>
//                   <h2 className="text-xl font-bold tracking-tight">
//                     Publish your first role
//                   </h2>
//                 </div>
//               </div>
//               <p className="mt-5 text-sm leading-6 text-muted-foreground">
//                 Add title, location, salary range, required skills, and a clear
//                 job description. Candidates can apply directly after the role is
//                 published.
//               </p>
//               <div className="mt-5 grid gap-2">
//                 {[
//                   "Company profile and logo",
//                   "Role details and compensation",
//                   "Applicant review workflow",
//                 ].map((item) => (
//                   <p
//                     key={item}
//                     className="flex items-center gap-2 text-sm font-medium"
//                   >
//                     <CheckCircle2 className="size-4 text-primary" />
//                     {item}
//                   </p>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className="px-4 py-10 md:py-12">
//         <div className="mx-auto max-w-7xl space-y-6 md:px-6">
//           {data.error && (
//             <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
//               {data.error}
//             </div>
//           )}

//           <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
//             <StatCard
//               label="Published jobs"
//               value={stats.activeJobs}
//               icon={BriefcaseBusiness}
//             />
//             <StatCard label="Drafts" value={stats.draftJobs} icon={Clock3} />
//             <StatCard
//               label="Applications"
//               value={stats.applications}
//               icon={UsersRound}
//             />
//             <StatCard
//               label="Company profiles"
//               value={stats.companies}
//               icon={Building2}
//             />
//           </div>

//           <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
//             <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
//               <div className="flex flex-wrap items-center justify-between gap-3">
//                 <div>
//                   <p className="text-sm font-semibold text-muted-foreground">
//                     Job activity
//                   </p>
//                   <h2 className="mt-1 text-2xl font-bold tracking-tight">
//                     Current roles
//                   </h2>
//                 </div>
//                 <Button variant="outline" asChild>
//                   <Link href="/employers/dashboard/post-job" prefetch={false}>
//                     New post
//                   </Link>
//                 </Button>
//               </div>

//               <div className="mt-6 space-y-3">
//                 {data.jobs.length > 0 ? (
//                   data.jobs.map((job) => (
//                     <article
//                       key={job.id}
//                       className="rounded-2xl border border-border/70 bg-background p-4"
//                     >
//                       <div className="flex flex-wrap items-start justify-between gap-3">
//                         <div>
//                           <Badge
//                             variant={
//                               job.status === "published" ? "success" : "soft"
//                             }
//                             className="capitalize"
//                           >
//                             {job.status}
//                           </Badge>
//                           <h3 className="mt-3 text-lg font-bold tracking-tight">
//                             {job.title}
//                           </h3>
//                           <p className="mt-1 text-sm text-muted-foreground">
//                             {job.companyName} · {job.location}
//                           </p>
//                         </div>
//                         <div className="text-right text-sm text-muted-foreground">
//                           <p className="font-semibold text-foreground">
//                             {job.applications}
//                           </p>
//                           <p>applications</p>
//                         </div>
//                       </div>
//                       <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3 text-sm text-muted-foreground">
//                         <span className="inline-flex items-center gap-1.5">
//                           <CalendarDays className="size-4" />
//                           Posted {formatDate(job.postedAt)}
//                         </span>
//                         <Button variant="ghost" size="sm">
//                           View applicants
//                           <ArrowRight className="size-3.5" />
//                         </Button>
//                       </div>
//                     </article>
//                   ))
//                 ) : (
//                   <div className="rounded-3xl border border-dashed border-border bg-background p-8 text-center">
//                     <Megaphone className="mx-auto size-8 text-primary" />
//                     <h3 className="mt-4 text-xl font-bold tracking-tight">
//                       Your first job post will appear here.
//                     </h3>
//                     <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
//                       Start with one strong role. Add the salary range and
//                       required skills so candidates can quickly self-select.
//                     </p>
//                     <Button className="mt-5" asChild>
//                       <Link
//                         href="/employers/dashboard/post-job"
//                         prefetch={false}
//                       >
//                         Create job post
//                       </Link>
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             </section>

//             <div className="space-y-6">
//               <PipelineMeter stats={stats} />

//               <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
//                 <p className="text-sm font-semibold text-muted-foreground">
//                   Hiring tools
//                 </p>
//                 <div className="mt-5 space-y-3">
//                   {[
//                     {
//                       icon: Search,
//                       title: "Improve role quality",
//                       text: "Use clear title, work mode, pay range, and must-have skills.",
//                     },
//                     {
//                       icon: MessageSquare,
//                       title: "Candidate response",
//                       text: "Keep follow-ups short, fast, and specific to the role.",
//                     },
//                     {
//                       icon: BarChart3,
//                       title: "Pipeline review",
//                       text: "Compare applications by role and adjust listings early.",
//                     },
//                   ].map((item) => (
//                     <article
//                       key={item.title}
//                       className="rounded-2xl border border-border/70 bg-background p-4"
//                     >
//                       <item.icon className="size-5 text-primary" />
//                       <h3 className="mt-3 font-semibold">{item.title}</h3>
//                       <p className="mt-1 text-sm leading-6 text-muted-foreground">
//                         {item.text}
//                       </p>
//                     </article>
//                   ))}
//                 </div>
//               </section>
//             </div>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }
