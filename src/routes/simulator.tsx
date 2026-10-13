import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/lab/AppShell";
import { axis, CHART, DataBadge, MetricRow, NumField, PageHeader, Panel, SliderField, Warnings } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebtSensitivity } from "@/components/lab/DebtSensitivity";
import { ExportPdfButton } from "@/components/lab/ExportPdfButton";
import { useLab } from "@/lib/store";
import { runScenario, STRATEGIES, strategyAssumptions, type Baseline } from "@/lib/finance/scenario";
import { cr, num, pct, x } from "@/lib/finance/format";

export const Route = createFileRoute("/simulator")({
  head: () => ({ meta: [
    { title: "Capital-Structure Simulator — CapitalLab" },
    { name: "description", content: "Live scenario engine comparing equity, debt, asset monetisation and blended deleveraging." },
    { property: "og:title", content: "Capital-Structure Simulator — CapitalLab" },
    { property: "og:description", content: "Adjust assumptions and watch leverage, liquidity and dilution recalculate instantly." },
  ] }),
  component: Simulator,
});

function Simulator() {
  const lab = useLab();
  const { baseline: b, assumptions: a, setAssumption: setA, mode } = lab;
  const r = useMemo(() => runScenario(b, a), [b, a]);
  const matrix = useMemo(() => STRATEGIES.map((s) => ({ s, r: runScenario(b, strategyAssumptions(s.key, a)) })), [b, a]);
  const [name, setName] = useState("");
  const setB = (k: keyof Baseline, v: number | null) => lab.set({ customBaseline: { ...lab.customBaseline, [k]: k === "ebit" ? v : v ?? 0 } });
  const o = r.opening;
  const better = (after: number | null, before: number | null) => (after != null && before != null ? (after < before ? "positive" : after > before ? "caution" : undefined) : undefined);
  const k = (v: number) => `₹${(v / 1000).toFixed(0)}k`;

  const sensitivity = [-2, -1, 0, 1, 2].map((d) => ({
    rate: `${(a.newDebtRate + d).toFixed(2)}%`,
    interest: Math.max(0, b.financeCost + (a.newDebt * (a.newDebtRate + d)) / 100 - r.interestSaving),
  }));

  return (
    <AppShell crumb="Simulator">
      <PageHeader eyebrow={mode === "ril" ? "Baseline · RIL FY2019–20" : "Baseline · Custom company"} title="Capital-structure simulator"
        description="Proceeds flow to cash first; only specified repayments reduce debt. Historical figures are never modified."
        actions={<>
          <Button variant="outline" onClick={() => { lab.resetRil(); toast.success("Reset to RIL FY2019–20"); }}><RotateCcw className="mr-1.5 h-4 w-4" />Reset to RIL FY2019–20</Button>
          <Button variant="outline" onClick={() => { lab.startCustom(); toast.success("Custom company started"); }}>Start Custom Company</Button>
          <ExportPdfButton caseStudy={mode === "ril"} simulator label="Export PDF report" />
        </>} />

      {mode === "custom" && (
        <Panel title="Custom company baseline" kind="assumption" className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <NumField label="Company name (₹ cr)" value={null} onChange={() => {}} optional />
            <NumField label="Gross debt" unit="₹ cr" value={b.grossDebt} onChange={(v) => setB("grossDebt", v)} />
            <NumField label="Cash" unit="₹ cr" value={b.cash} onChange={(v) => setB("cash", v)} />
            <NumField label="EBITDA" unit="₹ cr" value={b.ebitda} onChange={(v) => setB("ebitda", v)} allowNegative />
            <NumField label="EBIT" unit="₹ cr" value={b.ebit} onChange={(v) => setB("ebit", v)} allowNegative optional />
            <NumField label="Finance cost" unit="₹ cr" value={b.financeCost} onChange={(v) => setB("financeCost", v)} />
            <NumField label="Total equity" unit="₹ cr" value={b.totalEquity} onChange={(v) => setB("totalEquity", v)} allowNegative />
            <NumField label="Shares outstanding" unit="cr" value={b.sharesCr} onChange={(v) => setB("sharesCr", v)} />
          </div>
          <div className="mt-3 max-w-md space-y-1">
            <label className="text-xs font-medium">Proposed use of proceeds</label>
            <Input value={a.useOfProceeds} onChange={(e) => setA("useOfProceeds", e.target.value)} />
          </div>
        </Panel>
      )}

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Panel title="Assumptions" kind="assumption" className="xl:sticky xl:top-20 xl:self-start">
          <div className="space-y-5">
            <SliderField label="Equity raise" unit="cr" value={a.equityRaise} onChange={(v) => setA("equityRaise", v)} min={0} max={100000} step={100} tip="Gross equity proceeds before transaction costs." />
            <SliderField label="% of equity proceeds to debt repayment" unit="%" value={a.pctEquityToDebt} onChange={(v) => setA("pctEquityToDebt", v)} min={0} max={100} />
            <SliderField label="New borrowing" unit="cr" value={a.newDebt} onChange={(v) => setA("newDebt", v)} min={0} max={100000} step={100} />
            <SliderField label="Interest rate on new debt" unit="%" value={a.newDebtRate} onChange={(v) => setA("newDebtRate", v)} min={4} max={15} step={0.01} />
            <SliderField label="Additional debt repayment" unit="cr" value={a.debtRepay} onChange={(v) => setA("debtRepay", v)} min={0} max={100000} step={100} tip="Repayment funded from cash or asset proceeds, on top of equity-directed repayment." />
            <SliderField label="Rate saved on repaid debt" unit="%" value={a.repaidDebtRate} onChange={(v) => setA("repaidDebtRate", v)} min={4} max={15} step={0.01} tip="Illustrative interest saving = debt repaid × this rate. Not applied to all existing debt." />
            <SliderField label="Asset monetisation proceeds" unit="cr" value={a.assetSale} onChange={(v) => setA("assetSale", v)} min={0} max={200000} step={100} />
            <SliderField label="EBITDA change" unit="%" value={a.ebitdaChange} onChange={(v) => setA("ebitdaChange", v)} min={-30} max={30} />
            <SliderField label="Minimum cash reserve" unit="cr" value={a.minCash} onChange={(v) => setA("minCash", v)} min={0} max={50000} step={100} />
            <SliderField label="Transaction costs" unit="%" value={a.txnCostPct} onChange={(v) => setA("txnCostPct", v)} min={0} max={5} step={0.05} tip="Applied to gross proceeds from equity, debt and asset sales." />
            <SliderField label="Capital need" unit="cr" value={a.capitalNeed} onChange={(v) => setA("capitalNeed", v)} min={0} max={200000} step={100} tip="Used for % funded, funding gap and the A–D strategy comparison." />
            <div className="grid grid-cols-2 gap-3 border-t pt-4">
              <NumField label="Issue price" unit="₹/sh" value={a.issuePrice} onChange={(v) => setA("issuePrice", v ?? 0)} />
              <NumField label="Promoter holding" unit="%" value={a.promoterPct} onChange={(v) => setA("promoterPct", v ?? 0)} />
            </div>
          </div>
        </Panel>

        <div className="min-w-0 space-y-4">
          <Warnings items={r.warnings} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Pro-forma balance sheet" kind="assumption">
              <MetricRow label="Gross debt" before={cr(b.grossDebt)} after={cr(r.pfGross)} tone={better(r.pfGross, b.grossDebt)} tip="Gross debt + new borrowing − debt repaid" />
              <MetricRow label="Cash" before={cr(b.cash)} after={cr(r.pfCash)} tip="Cash + net equity + net asset proceeds + net new debt − debt repaid" />
              <MetricRow label="Net debt" before={cr(o.netDebt)} after={cr(r.pfNet)} tone={better(r.pfNet, o.netDebt)} tip="Pro-forma gross debt − pro-forma cash" />
              <MetricRow label="Net Debt / EBITDA" before={x(o.ndEbitda)} after={x(r.pfNdEbitda)} tone={better(r.pfNdEbitda, o.ndEbitda)} tip="Pro-forma net debt / EBITDA × (1 + EBITDA change)" />
              <MetricRow label="Gross Debt / EBITDA" before={x(o.gdEbitda)} after={x(r.pfGdEbitda)} tone={better(r.pfGdEbitda, o.gdEbitda)} tip="Pro-forma gross debt / pro-forma EBITDA" />
              <MetricRow label="Net gearing" before={pct(o.netGearing)} after={pct(r.pfGearing)} tone={better(r.pfGearing, o.netGearing)} tip="Net debt / (total equity + net equity raised)" />
              <MetricRow label="Interest coverage (EBIT / finance cost)" before={x(o.interestCover)} after={x(r.pfInterestCover)} tip="Shown only when EBIT is provided." />
            </Panel>
            <Panel title="Cost, dilution and funding" kind="assumption">
              <MetricRow label="Est. annual finance cost" before={cr(b.financeCost)} after={cr(r.pfFinance)} tone={better(r.pfFinance, b.financeCost)} tip="Existing finance cost + new debt × rate − debt repaid × saved rate" />
              <MetricRow label="Incremental interest (new debt)" after={cr(r.incrementalInterest)} tip="New borrowing × assumed rate" />
              <MetricRow label="Illustrative interest saving" after={cr(r.interestSaving)} tip="Debt repaid × rate saved on repaid debt" />
              <MetricRow label="New shares issued" after={`${num(r.newSharesCr, 2)} cr`} tip="Equity raise / issue price" />
              <MetricRow label="Dilution (non-subscribers)" after={pct(r.dilution, 2)} tip="New shares / (existing + new shares)" />
              <MetricRow label="Promoter stake if not subscribing" before={`${a.promoterPct.toFixed(1)}%`} after={pct(r.promoterPost)} />
              <MetricRow label="Capital need funded" after={pct(r.fundedPct)} tip="Net proceeds / capital need" />
              <MetricRow label="Remaining funding gap" after={cr(r.fundingGap)} tone={r.fundingGap > 0 ? "caution" : "positive"} />
              <MetricRow label="Cash reserve surplus / (shortfall)" after={cr(r.reserveGap)} tone={r.reserveGap < 0 ? "caution" : "positive"} tip="Pro-forma cash − minimum cash reserve" />
            </Panel>
          </div>

          <Panel title="Model insight" kind="calculated">
            <p className="text-sm leading-relaxed">
              At the current assumptions, the scenario {r.netDebtChange <= 0 ? "reduces" : "increases"} net debt by {cr(Math.abs(r.netDebtChange))} and changes Net Debt / EBITDA from {x(o.ndEbitda)} to {x(r.pfNdEbitda)}. It repays {cr(r.repaid)} of debt and retains {cr(r.pfCash)} of cash after transaction costs of {cr(r.totalCosts)}
              {r.reserveGap < 0 ? `, which is ${cr(-r.reserveGap)} below the minimum reserve.` : `, ${cr(r.reserveGap)} above the minimum reserve.`}
              {a.equityRaise > 0 && ` Shareholders who do not participate are diluted by ${pct(r.dilution, 2)}; in a rights issue, holders who fully exercise their entitlement preserve their proportional ownership.`}
            </p>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Before vs after: debt and cash">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[{ n: "Gross debt", before: b.grossDebt, after: r.pfGross }, { n: "Cash", before: b.cash, after: r.pfCash }, { n: "Net debt", before: o.netDebt, after: r.pfNet }]}>
                  <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="n" tick={axis} /><YAxis tick={axis} tickFormatter={k} />
                  <Tooltip formatter={(v: number) => cr(v)} /><Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="before" name="Baseline" fill="var(--chart-5)" radius={[4, 4, 0, 0]} /><Bar dataKey="after" name="Pro-forma" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Sources and uses of funds">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[{ n: "Sources", ...Object.fromEntries(r.sources.map((s) => [s.name, s.value])) }, { n: "Uses", ...Object.fromEntries(r.uses.map((s) => [s.name, s.value])) }]} layout="vertical">
                  <CartesianGrid horizontal={false} stroke="var(--border)" /><XAxis type="number" tick={axis} tickFormatter={k} /><YAxis type="category" dataKey="n" tick={axis} width={60} />
                  <Tooltip formatter={(v: number) => cr(v)} /><Legend wrapperStyle={{ fontSize: 11 }} />
                  {r.sources.map((s, i) => <Bar key={s.name} dataKey={s.name} stackId="a" fill={CHART[i]} />)}
                  {r.uses.map((s, i) => <Bar key={s.name} dataKey={s.name} stackId="a" fill={CHART[(i + 2) % 5]} />)}
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Net Debt / EBITDA by strategy">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[{ n: "Baseline", v: o.ndEbitda ?? 0 }, { n: "Current", v: r.pfNdEbitda ?? 0 }, ...matrix.map(({ s, r }) => ({ n: s.short, v: r.pfNdEbitda ?? 0 }))]}>
                  <CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="n" tick={axis} /><YAxis tick={axis} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}×`} />
                  <Bar dataKey="v" radius={[4, 4, 0, 0]}>{[5, 0, 1, 1, 1, 1].map((c, i) => <Cell key={i} fill={i === 0 ? "var(--chart-5)" : i === 1 ? "var(--chart-1)" : "var(--chart-2)"} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Interest-cost sensitivity (new debt rate ±200 bp)">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={sensitivity}>
                  <CartesianGrid stroke="var(--border)" /><XAxis dataKey="rate" tick={axis} /><YAxis tick={axis} tickFormatter={k} domain={["auto", "auto"]} />
                  <Tooltip formatter={(v: number) => cr(v)} /><Line dataKey="interest" name="Finance cost" stroke="var(--chart-1)" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <Panel title="Scenario comparison matrix" kind="counterfactual" subtitle={`Each strategy raises the capital need of ${cr(a.capitalNeed)} using your rates, costs and EBITDA view.`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Strategy</th><th className="text-right">Debt repaid</th><th className="text-right">Net debt</th><th className="text-right">ND/EBITDA</th><th className="text-right">Finance cost</th><th className="text-right">Cash</th><th className="text-right">Dilution</th></tr></thead>
                <tbody className="num">
                  <tr className="border-t bg-primary-soft/50"><td className="py-2 font-medium">Your current scenario</td><td className="text-right">{cr(r.repaid)}</td><td className="text-right">{cr(r.pfNet)}</td><td className="text-right">{x(r.pfNdEbitda)}</td><td className="text-right">{cr(r.pfFinance)}</td><td className="text-right">{cr(r.pfCash)}</td><td className="text-right">{pct(r.dilution, 2)}</td></tr>
                  {matrix.map(({ s, r }) => (
                    <tr key={s.key} className="border-t"><td className="py-2 font-medium">{s.key}. {s.name}</td><td className="text-right">{cr(r.repaid)}</td><td className="text-right">{cr(r.pfNet)}</td><td className="text-right">{x(r.pfNdEbitda)}</td><td className="text-right">{cr(r.pfFinance)}</td><td className="text-right">{cr(r.pfCash)}</td><td className="text-right">{pct(r.dilution, 2)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">A: 100% equity, {a.pctEquityToDebt}% of net proceeds repay debt. B: 100% new debt, no repayment. C: 100% asset sales, {a.pctEquityToDebt}% of net proceeds repay debt. D: 60% equity / 40% asset sales, same repayment share.</p>
          </Panel>

          <Panel title="Save this scenario" actions={<DataBadge kind="assumption" />}>
            <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const n = name.trim() || `Scenario ${lab.saved.length + 1}`; lab.saveScenario(n); setName(""); toast.success(`Saved "${n}" — see Reports`); }}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Equity-led, 75% repayment" className="max-w-sm" />
              <Button type="submit"><Save className="mr-1.5 h-4 w-4" />Save scenario</Button>
            </form>
          </Panel>

          <Tabs defaultValue="debt">
            <TabsList><TabsTrigger value="debt">Debt sensitivity analysis</TabsTrigger></TabsList>
            <TabsContent value="debt"><DebtSensitivity ebitda={b.ebitda} financeCost={b.financeCost} ril={mode === "ril"} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
