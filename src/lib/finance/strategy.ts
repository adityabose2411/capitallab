import { ratio } from "./format";

export type Answers = {
  stage: string;
  objective: string;
  revenue: number | null;
  ebitda: number | null;
  grossDebt: number | null;
  cash: number | null;
  growth: number | null; // %
  ebitdaPredictable: string; // yes / volatile / negative
  capitalRequired: number | null;
  horizon: string;
  dilution: string; // Minimal / Moderate / Flexible
  risk: string; // Conservative / Balanced / Aggressive
  acquisitionTarget: string; // Yes / No / Still exploring
  monetisableAsset: string; // Yes / No / Unsure
  publicReady: string; // Yes / Partially / No
  useOfProceeds: string;
};

export const EMPTY_ANSWERS: Answers = {
  stage: "", objective: "", revenue: null, ebitda: null, grossDebt: null, cash: null, growth: null,
  ebitdaPredictable: "", capitalRequired: null, horizon: "", dilution: "", risk: "",
  acquisitionTarget: "", monetisableAsset: "", publicReady: "", useOfProceeds: "",
};

export const OPTIONS = {
  stage: ["Early-stage startup", "Growth-stage private company", "Established private company", "Listed company", "Large enterprise"],
  objective: ["Raise growth capital", "Reduce leverage", "Improve liquidity", "Enter a new market", "Acquire a competitor", "Sell a business unit", "Prepare for an IPO", "Refinance debt", "Improve profitability"],
  ebitdaPredictable: ["Positive and predictable", "Positive but volatile", "Negative"],
  horizon: ["Under 6 months", "6–12 months", "1–3 years", "Over 3 years"],
  dilution: ["Minimal", "Moderate", "Flexible"],
  risk: ["Conservative", "Balanced", "Aggressive"],
  acquisitionTarget: ["Yes", "No", "Still exploring"],
  monetisableAsset: ["Yes", "No", "Unsure"],
  publicReady: ["Yes", "Partially", "No"],
};

export type StrategyName =
  | "Equity-led capital raise" | "Debt financing or refinancing" | "Blended financing" | "Asset monetisation"
  | "IPO-readiness assessment" | "Acquisition-led growth" | "Strategic merger" | "No-go / insufficient data";

type Scored = { name: StrategyName; score: number; reasons: string[]; pros: string[]; cons: string[]; risks: string[] };

export type Recommendation = ReturnType<typeof recommend>;

const META: Record<StrategyName, { pros: string[]; cons: string[]; risks: string[]; next: string[] }> = {
  "Equity-led capital raise": {
    pros: ["No fixed repayment obligation", "Directly reduces leverage when proceeds repay debt", "Strengthens balance-sheet capacity"],
    cons: ["Dilutes non-participating shareholders", "Typically higher cost of capital than debt", "Possible negative signalling (pecking order)"],
    risks: ["Market-timing and pricing risk", "Under-subscription risk"],
    next: ["Size the raise against the deleveraging target", "Test investor appetite and pricing", "Define use-of-proceeds disclosure"],
  },
  "Debt financing or refinancing": {
    pros: ["No ownership dilution", "Interest is generally tax-deductible", "Faster execution than equity"],
    cons: ["Adds fixed obligations", "Increases leverage and covenant pressure"],
    risks: ["Interest-rate risk on floating debt", "Refinancing risk at maturity", "EBITDA stress reduces coverage"],
    next: ["Model debt service under EBITDA stress", "Compare fixed vs floating quotes", "Review covenant headroom"],
  },
  "Blended financing": {
    pros: ["Balances dilution and leverage", "Diversifies funding sources"],
    cons: ["More complex execution", "Multiple stakeholder negotiations"],
    risks: ["Execution of each leg may slip", "Coordination of timing"],
    next: ["Set target leverage band", "Determine equity/debt/asset mix", "Sequence transactions"],
  },
  "Asset monetisation": {
    pros: ["No dilution at parent level", "Crystallises value of non-core assets", "Can bring strategic partners"],
    cons: ["Loss of future cash flows from the asset", "Valuation discounts in forced sales"],
    risks: ["Buyer availability and pricing", "Separation and regulatory approvals"],
    next: ["Identify non-core assets", "Commission independent valuation", "Assess effect on core operations"],
  },
  "IPO-readiness assessment": {
    pros: ["Access to deep public equity", "Liquidity for existing shareholders", "Currency for future M&A"],
    cons: ["Ongoing disclosure and governance costs", "Dilution", "Market scrutiny"],
    risks: ["Valuation and market-window risk", "Readiness gaps delay listing"],
    next: ["Run the IPO planner", "Gap analysis on governance and audit", "Professional review of eligibility"],
  },
  "Acquisition-led growth": {
    pros: ["Speed to new markets or capabilities", "Potential synergies"],
    cons: ["Overpayment risk", "Integration complexity"],
    risks: ["Synergy shortfall", "Leverage rises if debt-funded"],
    next: ["Run the M&A planner", "Validate synergies bottom-up", "Diligence on target"],
  },
  "Strategic merger": {
    pros: ["Share-based combination preserves cash", "Shared risk"],
    cons: ["Governance and control trade-offs", "Cultural integration"],
    risks: ["Valuation disagreements", "Regulatory approvals"],
    next: ["Identify merger partners", "Relative valuation analysis"],
  },
  "No-go / insufficient data": {
    pros: ["Avoids decisions on incomplete information"],
    cons: ["Delays capital access"],
    risks: ["Opportunity cost"],
    next: ["Complete missing data fields", "Re-run the planner"],
  },
};

export function deriveMetrics(a: Answers) {
  const netDebt = a.grossDebt != null && a.cash != null ? a.grossDebt - a.cash : null;
  return {
    netDebt,
    ndEbitda: netDebt != null && a.ebitda != null && a.ebitda > 0 ? netDebt / a.ebitda : null,
    ebitdaMargin: ratio(a.ebitda, a.revenue),
    capitalToRevenue: ratio(a.capitalRequired, a.revenue),
    cashToNeed: ratio(a.cash, a.capitalRequired),
  };
}

export function recommend(a: Answers) {
  const m = deriveMetrics(a);
  const missing: string[] = [];
  if (!a.objective) missing.push("Primary objective");
  if (a.ebitda == null) missing.push("EBITDA");
  if (a.grossDebt == null) missing.push("Gross debt");
  if (a.cash == null) missing.push("Cash and cash equivalents");
  if (a.capitalRequired == null) missing.push("Required capital amount");
  if (a.revenue == null) missing.push("Revenue");
  if (!a.ebitdaPredictable) missing.push("EBITDA predictability");

  const s: Record<StrategyName, Scored> = {} as never;
  (Object.keys(META) as StrategyName[]).forEach((n) => (s[n] = { name: n, score: 40, reasons: [], ...META[n] }));
  const add = (n: StrategyName, v: number, why: string) => { s[n].score += v; s[n].reasons.push(`${v >= 0 ? "+" : ""}${v}: ${why}`); };

  const lev = m.ndEbitda;
  const volatile = a.ebitdaPredictable === "Positive but volatile";
  const negative = a.ebitdaPredictable === "Negative" || (a.ebitda != null && a.ebitda <= 0);
  const obj = a.objective;

  if (obj === "Reduce leverage" && m.netDebt != null && m.netDebt > 0) {
    add("Equity-led capital raise", 20, "Deleveraging objective with positive net debt — equity proceeds can repay debt");
    add("Asset monetisation", 15, "Asset sale proceeds can reduce net debt without parent dilution");
    add("Blended financing", 14, "Combining equity and asset sales spreads dilution and execution risk");
    add("Debt financing or refinancing", -25, "Adding debt does not reduce net debt");
  }
  if (obj === "Refinance debt") { add("Debt financing or refinancing", 22, "Objective is refinancing existing obligations"); }
  if (obj === "Improve liquidity") { add("Debt financing or refinancing", 8, "Committed facilities can improve liquidity"); add("Asset monetisation", 10, "Converts illiquid assets to cash"); }
  if (obj === "Raise growth capital" || obj === "Enter a new market") {
    add("Equity-led capital raise", 15, "Growth capital is typically matched with long-duration equity");
    add("IPO-readiness assessment", a.stage.includes("private") ? 12 : 0, "Private company seeking growth capital");
  }
  if (obj === "Prepare for an IPO") add("IPO-readiness assessment", 30, "Stated objective is an IPO");
  if (obj === "Acquire a competitor") { add("Acquisition-led growth", 25, "Stated objective is acquisition"); add("Strategic merger", 10, "Merger is an alternative route to combination"); }
  if (obj === "Sell a business unit") add("Asset monetisation", 28, "Stated objective is divesting a unit");
  if (obj === "Improve profitability") { add("Asset monetisation", 6, "Exiting non-core assets can lift margins"); add("Debt financing or refinancing", 4, "Refinancing at lower rates cuts finance cost"); }

  if (lev != null) {
    if (lev > 3.5) { add("Debt financing or refinancing", -18, `Net Debt/EBITDA of ${lev.toFixed(2)}× is high`); add("Equity-led capital raise", 8, "High leverage favours equity"); }
    else if (lev < 2 && !volatile && !negative) add("Debt financing or refinancing", 14, `Moderate leverage (${lev.toFixed(2)}×) leaves debt capacity`);
  }
  if (volatile) add("Debt financing or refinancing", lev != null && lev > 2.5 ? -15 : -6, "Volatile EBITDA penalises fixed obligations");
  if (negative) { add("Debt financing or refinancing", -25, "Negative EBITDA — weak debt-service capacity"); add("Equity-led capital raise", 6, "Loss-making businesses usually rely on equity"); }
  if (a.dilution === "Minimal") { add("Equity-led capital raise", -15, "Low dilution tolerance"); add("IPO-readiness assessment", -8, "IPO dilutes existing holders"); }
  if (a.dilution === "Flexible") add("Equity-led capital raise", 8, "Dilution tolerance is flexible");
  if (a.monetisableAsset === "Yes") add("Asset monetisation", 15, "A monetisable unit/asset exists");
  if (a.monetisableAsset === "No") add("Asset monetisation", -30, "No monetisable asset identified");
  if (a.acquisitionTarget === "Yes") add("Acquisition-led growth", 15, "Credible target identified");
  if (a.acquisitionTarget === "No") { add("Acquisition-led growth", -25, "No credible target"); add("Strategic merger", -15, "No identified counterparty"); }
  if (a.publicReady === "No") add("IPO-readiness assessment", -20, "Not ready for public-market scrutiny");
  if (a.publicReady === "Yes" && a.stage.includes("private")) add("IPO-readiness assessment", 10, "Self-assessed public-market readiness");
  if (a.stage === "Listed company" || a.stage === "Large enterprise") add("IPO-readiness assessment", -40, "Company is already listed / large enterprise");
  if (a.stage === "Early-stage startup") { add("Debt financing or refinancing", -15, "Early-stage companies have limited debt capacity"); add("IPO-readiness assessment", -15, "Early stage for public markets"); }
  if (a.risk === "Conservative") add("Debt financing or refinancing", -6, "Conservative risk tolerance");
  if (a.risk === "Aggressive") { add("Debt financing or refinancing", 5, "Aggressive tolerance accepts leverage"); add("Acquisition-led growth", 5, "Aggressive tolerance"); }
  if (a.horizon === "Under 6 months") { add("IPO-readiness assessment", -12, "IPO timelines typically exceed 6 months"); add("Debt financing or refinancing", 5, "Debt can be arranged quickly"); }
  if (m.cashToNeed != null && m.cashToNeed >= 1) add("No-go / insufficient data", 0, "Existing cash covers requirement — consider internal funding first");
  if (missing.length >= 3) add("No-go / insufficient data", 45, `${missing.length} critical inputs missing`);
  else add("No-go / insufficient data", -30, "Core data provided");

  // Blended inherits partial support
  s["Blended financing"].score = Math.round((s["Blended financing"].score + (s["Equity-led capital raise"].score + s["Debt financing or refinancing"].score) / 2) / 2 + 5);

  const ranked = Object.values(s).sort((x, y) => y.score - x.score).map((r) => ({ ...r, score: Math.max(0, Math.min(100, Math.round(r.score))) }));
  const top = ranked[0];
  const confidence = missing.length >= 3 ? "Preliminary" : missing.length > 0 || volatile ? "Conditional" : "Stronger evidence";

  const changers: string[] = [];
  if (lev != null) changers.push(`Net Debt/EBITDA moving ${lev > 2 ? "below 2.0×" : "above 3.5×"} would shift the debt-vs-equity balance.`);
  changers.push("A change in dilution tolerance would re-weight equity options.");
  if (a.monetisableAsset !== "Yes") changers.push("Identifying a non-core asset would bring asset monetisation into play.");
  changers.push("Material change in interest rates or equity market conditions.");

  return { metrics: m, ranked, top, missing, confidence, changers, next: META[top.name].next };
}
