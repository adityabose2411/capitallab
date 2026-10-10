import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Compass, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataBadge } from "@/components/lab/ui";
import { RIL_FY20, RIL_RIGHTS, DISCLAIMER } from "@/lib/finance/ril-data";
import { cr } from "@/lib/finance/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CapitalLab — Model the capital. Test the strategy." },
      { name: "description", content: "Interactive corporate-finance simulator: capital structure, IPO and M&A planning, built around Reliance's 2020 rights issue." },
      { property: "og:title", content: "CapitalLab — Corporate Finance Decision Intelligence" },
      { property: "og:description", content: "Model financing scenarios, leverage and dilution with a live capital-structure engine." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: SlidersHorizontal, title: "Capital Structure Simulator", body: "Equity, debt, asset sales and blended deleveraging on a live cash-flow bridge.", to: "/simulator" as const },
  { icon: Compass, title: "IPO & M&A Strategy Planner", body: "Questionnaire-driven, rule-based recommendations with transparent reasoning.", to: "/strategy-planner" as const },
  { icon: LayoutDashboard, title: "Financial Intelligence Dashboard", body: "Leverage, liquidity and financing alternatives at a glance.", to: "/dashboard" as const },
];

function Landing() {
  const stats = [
    ["Net debt", cr(RIL_FY20.netDebt)],
    ["Gross debt", cr(RIL_FY20.grossDebt)],
    ["FY2019–20 EBITDA", cr(RIL_FY20.ebitda)],
    ["Rights issue", cr(RIL_RIGHTS.issueSize, 2)],
    ["Subscription", `${RIL_RIGHTS.subscription}×`],
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><BarChart3 className="h-4 w-4" /></span>
          <span className="font-semibold tracking-tight">CapitalLab</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button asChild variant="ghost" size="sm"><Link to="/methodology">Methodology</Link></Button>
          <Button asChild size="sm"><Link to="/dashboard">Open app</Link></Button>
        </nav>
      </header>

      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-lines opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Model the capital. Test the strategy. Make the decision.</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">Every financing decision has consequences. Model yours.</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">CapitalLab turns corporate financial data into interactive financing scenarios, capital-structure analysis and preliminary IPO/M&A strategy recommendations.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/simulator">Launch Decision Lab <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/case-study/ril-2020">Explore the Reliance Case</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} to={f.to} className="group rounded-xl border bg-card p-6 shadow-card transition hover:shadow-elevated">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-primary">Open <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Case: Reliance Industries, 2020 rights issue</h2>
              <p className="mt-1 text-sm text-muted-foreground">FY2019–20 consolidated position, ₹ crore. Goldman Sachs (India) Securities was one of the lead managers.</p>
            </div>
            <DataBadge kind="historical" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">{k}</div>
                <div className="num mt-2 text-xl font-semibold">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm text-muted-foreground">The historical case is educational. All outputs for hypothetical companies depend entirely on user-supplied assumptions.</p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</footer>
    </div>
  );
}
