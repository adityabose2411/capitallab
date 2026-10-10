import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/lab/AppShell";
import { axis, CHART, Kpi, PageHeader, Panel } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";
import { RIL_FY20, RIL_RIGHTS } from "@/lib/finance/ril-data";
import { baseMetrics, RIL_BASELINE, RIL_DEFAULT_ASSUMPTIONS, runScenario, STRATEGIES, strategyAssumptions } from "@/lib/finance/scenario";
import { cr, pct, x } from "@/lib/finance/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Executive Dashboard — CapitalLab" },
    { name: "description", content: "RIL FY2019–20 leverage, liquidity and financing alternatives dashboard." },
    { property: "og:title", content: "Executive Dashboard — CapitalLab" },
    { property: "og:description", content: "Historical capital structure and financing comparison for Reliance FY2019–20." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const m = baseMetrics(RIL_BASELINE);
  const alts = STRATEGIES.map((s) => ({ s, r: runScenario(RIL_BASELINE, strategyAssumptions(s.key, RIL_DEFAULT_ASSUMPTIONS)) }));
  const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`;
  return (
    <AppShell crumb="Dashboard">
      <PageHeader eyebrow="Historical base case · FY2019–20" title="Executive dashboard" description="Reliance Industries consolidated position at 31 March 2020. All ratios are calculated from reported figures."
        actions={<Button asChild><Link to="/simulator">Open simulator</Link></Button>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Gross Debt" value={cr(RIL_FY20.grossDebt)} kind="historical" />
        <Kpi label="Cash & Mkt. Securities" value={cr(RIL_FY20.cash)} kind="historical" />
        <Kpi label="Net Debt" value={cr(RIL_FY20.netDebt)} kind="historical" tip="Gross debt − cash and marketable securities" />
        <Kpi label="EBITDA" value={cr(RIL_FY20.ebitda)} kind="historical" />
        <Kpi label="Finance Cost" value={cr(RIL_FY20.financeCost)} kind="historical" />
        <Kpi label="Capital Expenditure" value={cr(RIL_FY20.capex)} kind="historical" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Net Debt / EBITDA" value={x(m.ndEbitda)} kind="calculated" tip="161,035 / 102,280" />
        <Kpi label="Gross Debt / EBITDA" value={x(m.gdEbitda)} kind="calculated" tip="336,294 / 102,280" />
        <Kpi label="Net Debt / Total Equity" value={pct(m.netGearing)} kind="calculated" tip="Net debt / total equity (₹4,53,331 cr)" />
        <Kpi label="Finance Cost / EBITDA" value={pct(m.fcEbitda)} kind="calculated" tip="22,027 / 102,280" />
        <Kpi label="Cash / Gross Debt" value={pct(m.cashGd)} kind="calculated" tip="175,259 / 336,294" />
        <Kpi label="Interest coverage" value="Not shown" sub="EBIT input not included in base case" tip="Shown only when EBIT is supplied (custom company)." />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Historical capital structure" kind="historical" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[{ name: "Total equity", value: RIL_FY20.totalEquity }, { name: "Gross debt", value: RIL_FY20.grossDebt }]} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {[0, 1].map((i) => <Cell key={i} fill={CHART[i]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => cr(v)} /><Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Debt versus cash" kind="historical">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[{ n: "Gross debt", v: RIL_FY20.grossDebt }, { n: "Cash", v: RIL_FY20.cash }, { n: "Net debt", v: RIL_FY20.netDebt }]}>
              <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="n" tick={axis} /><YAxis tick={axis} tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => cr(v)} />
              <Bar dataKey="v" radius={[6, 6, 0, 0]}>{[0, 2, 1].map((c, i) => <Cell key={i} fill={CHART[c]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Leverage ratios" kind="calculated">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[{ n: "ND/EBITDA", v: m.ndEbitda }, { n: "GD/EBITDA", v: m.gdEbitda }]}>
              <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="n" tick={axis} /><YAxis tick={axis} />
              <Tooltip formatter={(v: number) => `${v.toFixed(2)}×`} /><ReferenceLine y={3} stroke="var(--caution)" strokeDasharray="4 4" />
              <Bar dataKey="v" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Financing alternatives — raising ₹53,124 cr" kind="counterfactual" className="lg:col-span-2" subtitle="Each alternative raises the same amount; 75% of net proceeds to debt repayment where applicable.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Strategy</th><th className="text-right">Pro-forma net debt</th><th className="text-right">ND/EBITDA</th><th className="text-right">Finance cost</th><th className="text-right">Dilution</th></tr></thead>
              <tbody className="num">
                {alts.map(({ s, r }) => (
                  <tr key={s.key} className="border-t"><td className="py-2 font-medium">{s.key}. {s.name}</td><td className="text-right">{cr(r.pfNet)}</td><td className="text-right">{x(r.pfNdEbitda)}</td><td className="text-right">{cr(r.pfFinance)}</td><td className="text-right">{pct(r.dilution)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Rights issue proceeds allocation" kind="historical">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{ name: "Debt repayment", value: RIL_RIGHTS.debtRepayment }, { name: "General corporate", value: RIL_RIGHTS.generalCorporate }]} dataKey="value" innerRadius={50} outerRadius={80}>
                {[0, 1].map((i) => <Cell key={i} fill={CHART[i]} />)}
              </Pie><Tooltip formatter={(v: number) => cr(v, 2)} /><Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Strategy insight" kind="calculated" className="mt-4">
        <p className="text-sm leading-relaxed">
          At 31 March 2020, RIL carried net debt of {cr(m.netDebt)} — {x(m.ndEbitda)} EBITDA — with finance costs absorbing {pct(m.fcEbitda)} of EBITDA. The rights issue equalled {pct(RIL_RIGHTS.issueSize / RIL_FY20.netDebt)} of net debt: a material deleveraging instrument, but not sufficient by itself to eliminate net debt. Debt financing of the same amount would have raised leverage rather than reduced it.
        </p>
      </Panel>
    </AppShell>
  );
}
