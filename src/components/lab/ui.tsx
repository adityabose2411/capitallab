import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type DataKind = "historical" | "calculated" | "assumption" | "counterfactual" | "recommendation";
const KIND: Record<DataKind, { label: string; cls: string }> = {
  historical: { label: "Reported historical data", cls: "bg-primary-soft text-accent-foreground" },
  calculated: { label: "Calculated from reported data", cls: "bg-secondary text-foreground" },
  assumption: { label: "User-defined assumption", cls: "bg-caution-soft text-caution" },
  counterfactual: { label: "Illustrative counterfactual", cls: "bg-caution-soft text-caution" },
  recommendation: { label: "Model recommendation", cls: "bg-positive-soft text-positive" },
};

export function DataBadge({ kind, className }: { kind: DataKind; className?: string }) {
  const k = KIND[kind];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", k.cls, className)}>
      {k.label}
    </span>
  );
}

export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Formula" className="text-muted-foreground hover:text-primary">
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}

export function Panel({ title, kind, actions, children, className, subtitle }: { title?: ReactNode; subtitle?: ReactNode; kind?: DataKind; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-card", className)}>
      {(title || kind || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h3 className="text-sm font-semibold tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {kind && <DataBadge kind={kind} />}
            {actions}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, tip, kind, tone }: { label: string; value: ReactNode; sub?: ReactNode; tip?: ReactNode; kind?: DataKind; tone?: "positive" | "caution" | "default" }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <div className={cn("num mt-2 text-2xl font-semibold tracking-tight", tone === "positive" && "text-positive", tone === "caution" && "text-caution")}>{value}</div>
      {(sub || kind) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {sub}
          {kind && <DataBadge kind={kind} />}
        </div>
      )}
    </div>
  );
}

export function MetricRow({ label, before, after, tip, tone }: { label: string; before?: ReactNode; after: ReactNode; tip?: ReactNode; tone?: "positive" | "caution" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {label} {tip && <InfoTip>{tip}</InfoTip>}
      </span>
      <span className="num flex items-center gap-2 text-right">
        {before !== undefined && <span className="text-muted-foreground">{before} →</span>}
        <span className={cn("font-semibold", tone === "positive" && "text-positive", tone === "caution" && "text-caution")}>{after}</span>
      </span>
    </div>
  );
}

export function SliderField({ label, value, onChange, min, max, step = 1, unit, tip }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string; tip?: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs font-medium">
          {label} {tip && <InfoTip>{tip}</InfoTip>}
        </label>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            aria-label={label}
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              onChange(Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);
            }}
            className="num h-7 w-28 text-right text-xs"
          />
          {unit && <span className="w-6 text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export function NumField({ label, value, onChange, unit, allowNegative, optional, error }: { label: string; value: number | null; onChange: (v: number | null) => void; unit?: string; allowNegative?: boolean; optional?: boolean; error?: string }) {
  const neg = !allowNegative && value != null && value < 0;
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">
        {label} {optional && <span className="text-muted-foreground">(optional)</span>}
      </label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={value ?? ""}
          placeholder={optional ? "Leave blank if unknown" : "Required"}
          onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
          className={cn("num h-9", (neg || error) && "border-destructive")}
        />
        {unit && <span className="whitespace-nowrap text-xs text-muted-foreground">{unit}</span>}
      </div>
      {neg && <p className="text-xs text-destructive">Must not be negative.</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Warnings({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-lg border border-caution/40 bg-caution-soft p-3 text-xs text-caution">
      <ul className="list-disc space-y-1 pl-4">{items.map((w) => <li key={w}>{w}</li>)}</ul>
    </div>
  );
}

export const CHART = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export const axis = { fontSize: 11, fill: "var(--muted-foreground)" };
