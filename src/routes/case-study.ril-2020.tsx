import { createFileRoute } from "@tanstack/react-router";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/lab/AppShell";
import { CHART, DataBadge, Kpi, PageHeader, Panel } from "@/components/lab/ui";
import { RIL_FY20, RIL_RIGHTS, RIL_TIMELINE, SOURCES } from "@/lib/finance/ril-data";
import { cr, num } from "@/lib/finance/format";
import { ExportPdfButton } from "@/components/lab/ExportPdfButton";

export const Route = createFileRoute("/case-study/ril-2020")({
  head: () => ({ meta: [
    { title: "RIL 2020 Rights Issue Case — CapitalLab" },
    { name: "description", content: "Evidence-led case on Reliance Industries' ₹53,124.20 crore rights issue: terms, proceeds and deleveraging impact." },
    { property: "og:title", content: "Reliance 2020 Rights Issue — CapitalLab Case Study" },
    { property: "og:description", content: "Terms, subscription, use of proceeds and impact on net debt." },
  ] }),
  component: CaseStudy,
});

function CaseStudy() {
  const R = RIL_RIGHTS;
  const debtShare = (R.debtRepayment / R.netProceeds) * 100;
  const issueVsNd = (R.issueSize / RIL_FY20.netDebt) * 100;
  const repayVsNd = (R.debtRepayment / RIL_FY20.netDebt) * 100;
  const terms: [string, string][] = [
    ["Issuer", "Reliance Industries Limited"], ["Transaction", "2020 rights issue"], ["Issue size", cr(R.issueSize, 2)],
    ["Shares offered", num(R.sharesOffered)], ["Issue price", "₹1,257"], ["Rights ratio", "1 new share for every 15 eligible shares"],
    ["Record date", R.recordDate], ["Issue period", R.issuePeriod], ["Initial payment", "₹314.25 per share"],
    ["Remaining payments", "₹314.25 and ₹628.50 through later calls"], ["Overall subscription", "1.59×"], ["Public portion subscription", "1.22×"],
    ["Net proceeds", cr(R.netProceeds, 2)], ["Debt repayment / prepayment", cr(R.debtRepayment, 2)], ["General corporate purposes", cr(R.generalCorporate, 2)],
  ];
  return (
    <AppShell crumb="RIL 2020 Case">
      <PageHeader eyebrow="Historical case" title="Reliance Industries — 2020 rights issue" description="India's largest rights issue at the time, launched in May 2020 during the COVID-19 market dislocation." actions={<ExportPdfButton caseStudy simulator={false} label="Export case PDF" />} />

      <div className="grid gap-3 md:grid-cols-3">
        <Kpi label="Net proceeds to debt repayment" value={`${debtShare.toFixed(2)}%`} sub="39,755.08 / 53,036.13" kind="calculated" />
        <Kpi label="Rights issue / Mar-2020 net debt" value={`${issueVsNd.toFixed(2)}%`} sub="53,124.20 / 1,61,035" kind="calculated" />
        <Kpi label="Debt repayment / Mar-2020 net debt" value={`${repayVsNd.toFixed(2)}%`} sub="39,755.08 / 1,61,035" kind="calculated" />
      </div>

      <div className="mt-4 rounded-xl border-l-4 border-primary bg-primary-soft p-5">
        <p className="text-base font-medium">"The rights issue was a material deleveraging instrument, but it was not sufficient by itself to eliminate net debt."</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Transaction terms" kind="historical" className="lg:col-span-2">
          <dl className="grid gap-x-6 sm:grid-cols-2">
            {terms.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="num text-right font-medium">{v}</dd></div>
            ))}
          </dl>
        </Panel>
        <Panel title="Use of net proceeds" kind="historical">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[{ name: "Debt repayment", value: R.debtRepayment }, { name: "General corporate", value: R.generalCorporate }]} dataKey="value" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {[0, 1].map((i) => <Cell key={i} fill={CHART[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => cr(v, 2)} /><Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-muted-foreground">{debtShare.toFixed(2)}% designated for debt repayment/prepayment</p>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Transaction timeline" kind="historical">
          <ol className="relative space-y-5 border-l pl-5">
            {RIL_TIMELINE.map((t) => (
              <li key={t.date}>
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-xs font-semibold text-primary">{t.date}</p>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.body}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <div className="space-y-4">
          <Panel title="Broader capital-raising programme" kind="historical">
            <p className="num text-3xl font-semibold">{cr(R.broaderProgramme)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Reported total raised through the rights issue <em>and</em> asset monetisation (including Jio Platforms and Reliance Retail stake sales). This is a separate historical outcome — it is <strong>not</strong> the proceeds of the rights issue alone.</p>
          </Panel>
          <Panel title="Role of Goldman Sachs">
            <p className="text-sm text-muted-foreground">Goldman Sachs (India) Securities Private Limited was <strong className="text-foreground">one of the lead managers</strong> to the issue, alongside other banks. It was not the sole executor of the transaction.</p>
          </Panel>
        </div>
      </div>

      <Panel title="Sources" className="mt-4" subtitle="Source references; availability of each page is not guaranteed at runtime.">
        <ol className="space-y-1.5 text-sm">
          {SOURCES.map((s) => (
            <li key={s.n} className="flex gap-2"><span className="text-muted-foreground">{s.n}.</span><a href={s.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{s.title}</a></li>
          ))}
        </ol>
        <div className="mt-3"><DataBadge kind="historical" /></div>
      </Panel>
    </AppShell>
  );
}
