import { ratio } from "./format";

export type IpoInputs = {
  revenue: number; priorRevenue: number; ebitda: number; netProfit: number; netDebt: number; totalEquity: number;
  existingSharesCr: number; newSharesCr: number; peMultiple: number; evEbitdaMultiple: number;
  primaryMixPct: number; desiredCapital: number; issuanceCostPct: number; useOfProceeds: string; timeline: string;
  method: "ev" | "pe";
  predictability: number; governance: number; disclosure: number; clarity: number; marketRisk: number; // 1–5 self-assessment
};

export const IPO_DEFAULTS: IpoInputs = {
  revenue: 2400, priorRevenue: 1950, ebitda: 480, netProfit: 230, netDebt: 350, totalEquity: 1600,
  existingSharesCr: 20, newSharesCr: 3, peMultiple: 28, evEbitdaMultiple: 15, primaryMixPct: 60,
  desiredCapital: 1200, issuanceCostPct: 3, useOfProceeds: "Capacity expansion and debt reduction", timeline: "12–18 months",
  method: "ev", predictability: 3, governance: 3, disclosure: 3, clarity: 4, marketRisk: 3,
};

export function runIpo(i: IpoInputs) {
  const growth = ratio(i.revenue - i.priorRevenue, i.priorRevenue);
  const margin = ratio(i.ebitda, i.revenue);
  const netMargin = i.revenue > 0 ? i.netProfit / i.revenue : null;
  const evImplied = i.ebitda > 0 ? i.evEbitdaMultiple * i.ebitda : null;
  const eqFromEv = evImplied != null ? evImplied - i.netDebt : null;
  const eqFromPe = i.netProfit > 0 ? i.peMultiple * i.netProfit : null;
  const equityValue = i.method === "ev" ? eqFromEv : eqFromPe;
  const price = equityValue != null && equityValue > 0 && i.existingSharesCr > 0 ? equityValue / i.existingSharesCr : null;
  const evFromEquity = equityValue != null ? equityValue + i.netDebt : null;
  const mix = i.primaryMixPct / 100;
  const secondarySharesCr = mix > 0 ? (i.newSharesCr * (1 - mix)) / mix : 0;
  const primary = price != null ? i.newSharesCr * price : null;
  const secondary = price != null ? secondarySharesCr * price : null;
  const netPrimary = primary != null ? primary * (1 - i.issuanceCostPct / 100) : null;
  const postShares = i.existingSharesCr + i.newSharesCr;
  const dilution = ratio(i.newSharesCr, postShares);
  const vsTarget = primary != null ? ratio(primary + (secondary ?? 0), i.desiredCapital) : null;
  const impliedPe = equityValue != null && i.netProfit > 0 ? equityValue / i.netProfit : null;
  const impliedEvEbitda = evFromEquity != null && i.ebitda > 0 ? evFromEquity / i.ebitda : null;

  const evGrid = [-4, -2, 0, 2, 4].map((d) => i.evEbitdaMultiple + d).filter((m) => m > 0);
  const stress = [-0.2, -0.1, 0, 0.1, 0.2];
  const evMatrix = evGrid.map((m) => ({ m, cells: stress.map((s) => { const eq = m * i.ebitda * (1 + s) - i.netDebt; return i.existingSharesCr > 0 && eq > 0 ? eq / i.existingSharesCr : null; }) }));
  const peGrid = [-8, -4, 0, 4, 8].map((d) => i.peMultiple + d).filter((m) => m > 0);
  const peMatrix = peGrid.map((m) => ({ m, cells: stress.map((s) => { const np = i.netProfit * (1 + s); return np > 0 && i.existingSharesCr > 0 ? (m * np) / i.existingSharesCr : null; }) }));

  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)));
  const fin = clamp((growth ?? 0) > 0.2 && (margin ?? 0) > 0.15 ? 5 : (growth ?? 0) > 0.1 && (margin ?? 0) > 0.1 ? 4 : (margin ?? 0) > 0 ? 3 : i.netProfit > 0 ? 2 : 1);
  const val = eqFromEv != null && eqFromPe != null ? clamp(5 - Math.abs(eqFromEv / eqFromPe - 1) * 8) : 1;
  const proceeds = i.useOfProceeds.trim().length > 15 ? 4 : i.useOfProceeds.trim() ? 2 : 1;
  const scorecard = [
    { k: "Financial performance", s: fin, basis: "Auto: revenue growth and EBITDA margin", gap: fin < 3 ? "Improve growth/margin track record" : "" },
    { k: "Earnings predictability", s: clamp(i.predictability), basis: "Self-assessed", gap: i.predictability < 3 ? "Provide multi-year audited track record" : "" },
    { k: "Governance & audit readiness", s: clamp(i.governance), basis: "Self-assessed", gap: i.governance < 3 ? "Independent board, audit committee, Big-4/peer audit" : "" },
    { k: "Disclosure readiness", s: clamp(i.disclosure), basis: "Self-assessed", gap: i.disclosure < 3 ? "Restated financials, MIS, risk factor drafting" : "" },
    { k: "Business-model clarity", s: clamp(i.clarity), basis: "Self-assessed", gap: i.clarity < 3 ? "Sharpen equity story and KPIs" : "" },
    { k: "Use-of-proceeds rationale", s: proceeds, basis: "Auto: specificity of stated use", gap: proceeds < 3 ? "Detail the deployment plan with amounts" : "" },
    { k: "Valuation support", s: val, basis: "Auto: consistency of EV/EBITDA vs P/E implied equity", gap: val < 3 ? "Methods diverge — revisit multiples or earnings" : "" },
    { k: "Market & execution risk", s: clamp(6 - i.marketRisk), basis: "Self-assessed (inverted)", gap: i.marketRisk > 3 ? "High perceived market/execution risk" : "" },
  ];
  const total = scorecard.reduce((a, b) => a + b.s, 0) / (scorecard.length * 5);

  const warnings: string[] = [];
  if (i.ebitda <= 0) warnings.push("EBITDA is not positive — EV/EBITDA valuation is not meaningful.");
  if (i.netProfit <= 0) warnings.push("Net profit is not positive — P/E valuation is not meaningful.");
  if (i.existingSharesCr <= 0) warnings.push("Existing shares outstanding are required to compute price per share.");
  if (equityValue != null && equityValue <= 0) warnings.push("Implied equity value is negative: net debt exceeds implied enterprise value.");

  return { growth, margin, netMargin, evImplied, eqFromEv, eqFromPe, equityValue, evFromEquity, price, primary, secondary, netPrimary, secondarySharesCr, postShares, dilution, vsTarget, impliedPe, impliedEvEbitda, evMatrix, peMatrix, stress, scorecard, total, warnings };
}
