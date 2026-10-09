export type MaCase = "downside" | "base" | "upside";
export type MaInputs = {
  role: "acquirer" | "target"; objective: string;
  targetRevenue: number; targetEbitda: number; targetNetDebt: number; purchaseEv: number;
  revSynergy: number; synergyMargin: number; costSynergy: number; recurringCost: number; integrationCost: number;
  debtPct: number; equityPct: number; cashPct: number; financingRate: number; integrationYears: number; realisationPct: number;
  buyerEbitda: number; buyerNetDebt: number; horizon: number; wacc: number;
  useDcf: boolean; growth: number; ebitMargin: number; tax: number; daPct: number; capexPct: number; nwcPct: number; terminalGrowth: number;
  scenario: MaCase;
};

export const MA_DEFAULTS: MaInputs = {
  role: "acquirer", objective: "Capability and market expansion",
  targetRevenue: 3000, targetEbitda: 450, targetNetDebt: 600, purchaseEv: 5400,
  revSynergy: 300, synergyMargin: 20, costSynergy: 90, recurringCost: 10, integrationCost: 220,
  debtPct: 50, equityPct: 30, cashPct: 20, financingRate: 9, integrationYears: 2, realisationPct: 70,
  buyerEbitda: 2200, buyerNetDebt: 3500, horizon: 7, wacc: 11,
  useDcf: true, growth: 8, ebitMargin: 11, tax: 25, daPct: 4, capexPct: 5, nwcPct: 10, terminalGrowth: 4,
  scenario: "base",
};

const CASE = { downside: { syn: 0.6, int: 1.25, growth: -3 }, base: { syn: 1, int: 1, growth: 0 }, upside: { syn: 1.15, int: 0.9, growth: 2 } };

export function dcf(i: MaInputs, growthAdj = 0) {
  const w = i.wacc / 100, g = i.terminalGrowth / 100;
  if (w <= g) return { ev: null, rows: [], error: "WACC must exceed terminal growth rate." };
  const rows: { year: number; revenue: number; ebit: number; nopat: number; da: number; capex: number; dNwc: number; fcf: number; pv: number }[] = [];
  let rev = i.targetRevenue, pvSum = 0, last = 0;
  for (let y = 1; y <= 5; y++) {
    const next = rev * (1 + (i.growth + growthAdj) / 100);
    const ebit = next * (i.ebitMargin / 100);
    const nopat = ebit * (1 - i.tax / 100);
    const da = next * (i.daPct / 100);
    const capex = next * (i.capexPct / 100);
    const dNwc = (next - rev) * (i.nwcPct / 100);
    const fcf = nopat + da - capex - dNwc;
    const pv = fcf / Math.pow(1 + w, y);
    rows.push({ year: y, revenue: next, ebit, nopat, da, capex, dNwc, fcf, pv });
    pvSum += pv; last = fcf; rev = next;
  }
  const tv = (last * (1 + g)) / (w - g);
  const pvTv = tv / Math.pow(1 + w, 5);
  return { ev: pvSum + pvTv, rows, pvTv, tv, error: null as string | null };
}

export function runMa(i: MaInputs) {
  const c = CASE[i.scenario];
  const warnings: string[] = [];
  const mixSum = i.debtPct + i.equityPct + i.cashPct;
  if (Math.abs(mixSum - 100) > 0.01) warnings.push(`Financing mix sums to ${mixSum}% — must equal 100%.`);
  if (i.targetEbitda <= 0) warnings.push("Target EBITDA is not positive — EV/EBITDA not meaningful.");

  const evEbitda = i.targetEbitda > 0 ? i.purchaseEv / i.targetEbitda : null;
  const evRev = i.targetRevenue > 0 ? i.purchaseEv / i.targetRevenue : null;
  const equityValue = i.purchaseEv - i.targetNetDebt;
  const grossSyn = i.revSynergy * (i.synergyMargin / 100) + i.costSynergy; // EBITDA-level
  const riskAdj = grossSyn * (i.realisationPct / 100) * c.syn;
  const netSyn = riskAdj - i.recurringCost;
  const integration = i.integrationCost * c.int;
  const w = i.wacc / 100;

  const synergyPv = (factor: number) => {
    let pv = 0;
    for (let y = 1; y <= i.horizon; y++) {
      const ramp = Math.min(1, y / Math.max(1, i.integrationYears));
      const s = (grossSyn * factor * ramp - i.recurringCost) * (1 - i.tax / 100);
      pv += s / Math.pow(1 + w, y);
    }
    return pv;
  };
  const synPvRisk = synergyPv((i.realisationPct / 100) * c.syn);
  const netSynergyValue = synPvRisk - integration;

  let cum = -integration, payback: number | null = null;
  for (let y = 1; y <= 30; y++) {
    const ramp = Math.min(1, y / Math.max(1, i.integrationYears));
    cum += (riskAdj * ramp - i.recurringCost) * (1 - i.tax / 100);
    if (cum >= 0) { payback = y; break; }
  }

  const debtFund = (equityValue * i.debtPct) / 100;
  const cashFund = (equityValue * i.cashPct) / 100;
  const equityFund = (equityValue * i.equityPct) / 100;
  const incInterest = (debtFund * i.financingRate) / 100;
  const pfEbitda = i.buyerEbitda + i.targetEbitda + riskAdj - i.recurringCost;
  const pfNetDebt = i.buyerNetDebt + i.targetNetDebt + debtFund + cashFund;
  const pfLev = pfEbitda > 0 ? pfNetDebt / pfEbitda : null;
  const buyerLev = i.buyerEbitda > 0 ? i.buyerNetDebt / i.buyerEbitda : null;

  const standalone = i.useDcf ? dcf(i, c.growth) : null;
  const standaloneEv = standalone?.ev ?? null;
  if (standalone?.error) warnings.push(standalone.error);
  const premium = standaloneEv != null ? i.purchaseEv - standaloneEv : null;
  const pv100 = synergyPv(1);
  const breakEven = premium != null && pv100 > 0 ? (premium + integration) / pv100 : null;
  const valueCreated = premium != null ? synPvRisk - integration - premium : null;

  const sens = [-20, -10, 0, 10, 20].map((d) => {
    const ev = i.purchaseEv * (1 + d / 100);
    return { d, ev, multiple: i.targetEbitda > 0 ? ev / i.targetEbitda : null, value: standaloneEv != null ? synPvRisk - integration - (ev - standaloneEv) : null };
  });

  return { evEbitda, evRev, equityValue, grossSyn, riskAdj, netSyn, integration, synPvRisk, netSynergyValue, payback, debtFund, cashFund, equityFund, incInterest, pfEbitda, pfNetDebt, pfLev, buyerLev, standalone, standaloneEv, premium, breakEven, valueCreated, sens, warnings };
}
