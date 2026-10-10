import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axis, DataBadge, MetricRow, Panel, SliderField } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RIL_RIGHTS } from "@/lib/finance/ril-data";
import { cr, x } from "@/lib/finance/format";

export function DebtSensitivity({ ebitda, financeCost, ril }: { ebitda: number; financeCost: number; ril: boolean }) {
  const [amount, setAmount] = useState<number>(RIL_RIGHTS.issueSize);
  const [rate, setRate] = useState(6.78);
  const [tenor, setTenor] = useState(5);
  const [type, setType] = useState<"fixed" | "floating">("fixed");
  const [shock, setShock] = useState(100);
  const [stress, setStress] = useState(0);
  const [profile, setProfile] = useState<"bullet" | "amortising">("bullet");

  const effRate = type === "floating" ? rate + shock / 100 : rate;
  const schedule = useMemo(() => {
    const rows = [];
    let bal = amount;
    const principal = profile === "amortising" ? amount / tenor : 0;
    for (let y = 1; y <= tenor; y++) {
      const interest = (bal * effRate) / 100;
      const p = profile === "bullet" ? (y === tenor ? amount : 0) : principal;
      rows.push({ y, open: bal, interest, principal: p, close: bal - p });
      bal -= p;
    }
    return rows;
  }, [amount, effRate, tenor, profile]);

  const annual = (amount * effRate) / 100;
  const stressedEbitda = ebitda * (1 + stress / 100);
  const cover = stressedEbitda > 0 ? stressedEbitda / (financeCost + annual) : null;
  const rateRows = [5, 6, 6.78, 7, 8, 8.75, 10, 12].map((r) => ({ r: `${r}%`, v: (amount * r) / 100 }));

  return (
    <div className="mt-3 space-y-4">
      {ril && (
        <Panel title="RIL reference: ₹53,124.20 cr of hypothetical additional debt" kind="counterfactual">
          <div className="grid gap-3 sm:grid-cols-3">
            {[[6.78, "At 6.78%"], [8.75, "At 8.75%"]].map(([r, l]) => (
              <div key={l} className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="num mt-1 text-xl font-semibold">{cr((RIL_RIGHTS.issueSize * (r as number)) / 100)}</div><div className="text-xs text-muted-foreground">simple annual interest</div></div>
            ))}
            <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Per +100 bp</div><div className="num mt-1 text-xl font-semibold">{cr(RIL_RIGHTS.issueSize / 100)}</div><div className="text-xs text-muted-foreground">change in annual interest</div></div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Illustrative counterfactual based on assumed rates — not actual borrowing by RIL.</p>
        </Panel>
      )}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Panel title="Debt terms" kind="assumption">
          <div className="space-y-5">
            <SliderField label="Debt amount" unit="cr" value={amount} onChange={setAmount} min={0} max={200000} step={100} />
            <SliderField label="Interest rate" unit="%" value={rate} onChange={setRate} min={4} max={15} step={0.01} />
            <SliderField label="Tenor" unit="yrs" value={tenor} onChange={setTenor} min={1} max={15} />
            <SliderField label="EBITDA stress" unit="%" value={stress} onChange={setStress} min={-50} max={20} />
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-medium">Rate type</label>
                <Select value={type} onValueChange={(v) => setType(v as "fixed")}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="floating">Floating</SelectItem></SelectContent></Select></div>
              <div><label className="text-xs font-medium">Repayment</label>
                <Select value={profile} onValueChange={(v) => setProfile(v as "bullet")}><SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bullet">Bullet</SelectItem><SelectItem value="amortising">Equal amortising</SelectItem></SelectContent></Select></div>
            </div>
            {type === "floating" && <SliderField label="Floating-rate shock" unit="bp" value={shock} onChange={setShock} min={-200} max={400} step={25} />}
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="Debt service" kind="counterfactual">
            <MetricRow label="Effective rate" after={`${effRate.toFixed(2)}%`} />
            <MetricRow label="Year-1 interest" after={cr(annual)} tip="Amount × effective rate (simple annual interest)" />
            <MetricRow label="+100 bp impact" after={cr(amount / 100)} />
            <MetricRow label="Total interest over tenor" after={cr(schedule.reduce((s, r) => s + r.interest, 0))} />
            <MetricRow label="Stressed EBITDA / total finance cost" after={x(cover)} tone={cover != null && cover < 3 ? "caution" : "positive"} tip="EBITDA × (1 + stress) / (existing finance cost + new interest)" />
          </Panel>
          <Panel title="Annual interest vs rate">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rateRows}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="r" tick={axis} /><YAxis tick={axis} /><Tooltip formatter={(v: number) => cr(v)} /><Bar dataKey="v" fill="var(--chart-1)" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
      <Panel title="Amortisation schedule" actions={<DataBadge kind="counterfactual" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm num">
            <thead className="text-left text-xs text-muted-foreground"><tr><th className="py-2">Year</th><th className="text-right">Opening</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="text-right">Closing</th></tr></thead>
            <tbody>{schedule.map((r) => <tr key={r.y} className="border-t"><td className="py-1.5">{r.y}</td><td className="text-right">{cr(r.open)}</td><td className="text-right">{cr(r.interest)}</td><td className="text-right">{cr(r.principal)}</td><td className="text-right">{cr(r.close)}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
