import { ratio } from "./format";
import { RIL_FY20, RIL_RIGHTS } from "./ril-data";

export type Baseline = {
  name: string;
  grossDebt: number;
  cash: number;
  ebitda: number;
  ebit: number | null;
  financeCost: number;
  totalEquity: number;
  sharesCr: number; // existing shares, crore
};

export type Assumptions = {
  equityRaise: number;
  issuePrice: number; // ₹ per share
  pctEquityToDebt: number; // 0–100
  newDebt: number;
  newDebtRate: number; // %
  debtRepay: number; // additional repayment funded from cash / asset proceeds
  repaidDebtRate: number; // % saved on repaid debt
  assetSale: number;
  ebitdaChange: number; // %
  minCash: number;
  txnCostPct: number; // % of gross proceeds
  capitalNeed: number;
  promoterPct: number;
  useOfProceeds: string;
};

export const RIL_BASELINE: Baseline = Object.freeze({
  name: RIL_FY20.name,
  grossDebt: RIL_FY20.grossDebt,
  cash: RIL_FY20.cash,
  ebitda: RIL_FY20.ebitda,
  ebit: null,
  financeCost: RIL_FY20.financeCost,
  totalEquity: RIL_FY20.totalEquity,
  sharesCr: RIL_FY20.sharesCr,
}) as Baseline;

export const RIL_DEFAULT_ASSUMPTIONS: Assumptions = Object.freeze({
  equityRaise: RIL_RIGHTS.issueSize,
  issuePrice: RIL_RIGHTS.issuePrice,
  pctEquityToDebt: 75,
  newDebt: 0,
  newDebtRate: 6.78,
  debtRepay: 0,
  repaidDebtRate: 6.78,
  assetSale: 0,
  ebitdaChange: 0,
  minCash: 25000,
  txnCostPct: 0.2,
  capitalNeed: RIL_RIGHTS.issueSize,
  promoterPct: 50.4,
  useOfProceeds: "Debt repayment/prepayment and general corporate purposes",
}) as Assumptions;

export const CUSTOM_DEFAULT_BASELINE: Baseline = {
  name: "Custom Company",
  grossDebt: 12000,
  cash: 2500,
  ebitda: 4000,
  ebit: 3000,
  financeCost: 900,
  totalEquity: 15000,
  sharesCr: 100,
};
export const CUSTOM_DEFAULT_ASSUMPTIONS: Assumptions = {
  equityRaise: 3000,
  issuePrice: 250,
  pctEquityToDebt: 60,
  newDebt: 0,
  newDebtRate: 9,
  debtRepay: 0,
  repaidDebtRate: 8.5,
  assetSale: 0,
  ebitdaChange: 0,
  minCash: 1500,
  txnCostPct: 2,
  capitalNeed: 3000,
  promoterPct: 55,
  useOfProceeds: "Deleveraging and growth capex",
};

export type BaseMetrics = ReturnType<typeof baseMetrics>;
export function baseMetrics(b: Baseline) {
  const netDebt = b.grossDebt - b.cash;
  return {
    netDebt,
    ndEbitda: ratio(netDebt, b.ebitda),
    gdEbitda: ratio(b.grossDebt, b.ebitda),
    netGearing: ratio(netDebt, b.totalEquity),
    fcEbitda: ratio(b.financeCost, b.ebitda),
    cashGd: ratio(b.cash, b.grossDebt),
    interestCover: b.ebit == null ? null : ratio(b.ebit, b.financeCost),
  };
}

export type Result = ReturnType<typeof runScenario>;

/** Explicit cash-flow bridge. Proceeds go to cash; only specified repayments reduce debt. */
export function runScenario(b: Baseline, a: Assumptions) {
  const warnings: string[] = [];
  const tc = a.txnCostPct / 100;
  const equityCosts = a.equityRaise * tc;
  const assetCosts = a.assetSale * tc;
  const debtCosts = a.newDebt * tc;
  const equityNet = a.equityRaise - equityCosts;
  const assetNet = a.assetSale - assetCosts;
  const debtNet = a.newDebt - debtCosts;
  const totalCosts = equityCosts + assetCosts + debtCosts;

  const equityDirected = (equityNet * a.pctEquityToDebt) / 100;
  let repaid = equityDirected + a.debtRepay;
  const cashAvailable = b.cash + equityNet + assetNet + debtNet;
  const maxRepay = Math.min(b.grossDebt + a.newDebt, cashAvailable);
  if (repaid > maxRepay) {
    warnings.push(
      `Requested repayments (₹${Math.round(repaid).toLocaleString("en-IN")} cr) exceed available cash or outstanding debt; capped at ₹${Math.round(maxRepay).toLocaleString("en-IN")} cr.`,
    );
    repaid = maxRepay;
  }

  const pfGross = b.grossDebt + a.newDebt - repaid;
  const pfCash = cashAvailable - repaid;
  const pfNet = pfGross - pfCash;
  const pfEbitda = b.ebitda * (1 + a.ebitdaChange / 100);
  const pfEbit = b.ebit == null ? null : b.ebit + (pfEbitda - b.ebitda);
  const incrementalInterest = (a.newDebt * a.newDebtRate) / 100;
  const interestSaving = (repaid * a.repaidDebtRate) / 100;
  const pfFinance = Math.max(0, b.financeCost + incrementalInterest - interestSaving);

  const reserveGap = pfCash - a.minCash;
  if (reserveGap < 0) warnings.push(`Pro-forma cash is ₹${Math.round(-reserveGap).toLocaleString("en-IN")} cr below the minimum cash reserve.`);
  if (pfEbitda <= 0) warnings.push("Pro-forma EBITDA is zero or negative; leverage ratios are not meaningful.");

  const newSharesCr = a.issuePrice > 0 ? a.equityRaise / a.issuePrice : 0;
  const dilution = ratio(newSharesCr, b.sharesCr + newSharesCr);
  const promoterPost = b.sharesCr + newSharesCr > 0 ? (a.promoterPct / 100) * (b.sharesCr / (b.sharesCr + newSharesCr)) : null;

  const funded = equityNet + assetNet + debtNet;
  const opening = baseMetrics(b);
  return {
    equityNet, assetNet, debtNet, totalCosts, equityDirected, repaid,
    pfGross, pfCash, pfNet, pfEbitda, pfFinance, incrementalInterest, interestSaving,
    pfNdEbitda: ratio(pfNet, pfEbitda),
    pfGdEbitda: ratio(pfGross, pfEbitda),
    pfGearing: ratio(pfNet, b.totalEquity + equityNet),
    pfFcEbitda: ratio(pfFinance, pfEbitda),
    pfInterestCover: pfEbit == null ? null : ratio(pfEbit, pfFinance),
    netDebtChange: pfNet - opening.netDebt,
    newSharesCr, dilution, promoterPost,
    funded,
    fundedPct: ratio(funded, a.capitalNeed),
    fundingGap: Math.max(0, a.capitalNeed - funded),
    reserveGap,
    opening,
    warnings,
    sources: [
      { name: "Equity (net)", value: equityNet },
      { name: "New debt (net)", value: debtNet },
      { name: "Asset sales (net)", value: assetNet },
    ],
    uses: [
      { name: "Debt repayment", value: repaid },
      { name: "Added to cash", value: Math.max(0, funded - repaid) },
      { name: "Transaction costs", value: totalCosts },
    ],
  };
}

export type StrategyKey = "A" | "B" | "C" | "D";
export const STRATEGIES: { key: StrategyKey; name: string; short: string }[] = [
  { key: "A", name: "Equity / Rights Issue", short: "Equity" },
  { key: "B", name: "Debt Financing", short: "Debt" },
  { key: "C", name: "Strategic Asset Monetisation", short: "Asset sale" },
  { key: "D", name: "Equity-Led Blended Deleveraging", short: "Blended" },
];

/** Each strategy raises the same capital need using the user's rates, costs and EBITDA view. */
export function strategyAssumptions(key: StrategyKey, a: Assumptions): Assumptions {
  const need = a.capitalNeed;
  const common = { ...a, equityRaise: 0, newDebt: 0, assetSale: 0, debtRepay: 0 };
  const net = need * (1 - a.txnCostPct / 100);
  const share = a.pctEquityToDebt / 100;
  switch (key) {
    case "A":
      return { ...common, equityRaise: need };
    case "B":
      return { ...common, newDebt: need, pctEquityToDebt: 0 };
    case "C":
      return { ...common, assetSale: need, debtRepay: net * share };
    case "D":
      return { ...common, equityRaise: need * 0.6, assetSale: need * 0.4, debtRepay: net * 0.4 * share };
  }
}
