import { RIL_FY20, RIL_RIGHTS, RIL_TIMELINE, SOURCES, DISCLAIMER } from "./finance/ril-data";
import { baseMetrics, RIL_BASELINE, runScenario, STRATEGIES, strategyAssumptions, type Assumptions, type Baseline } from "./finance/scenario";

// jsPDF's built-in fonts lack the ₹ glyph, so the PDF uses "Rs." with Indian grouping.
const n0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const n2 = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ok = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
const rs = (v: number | null | undefined, d = 0) => (ok(v) ? `Rs. ${(d ? n2 : n0).format(v)} cr` : "Not meaningful");
const xx = (v: number | null | undefined) => (ok(v) ? `${v.toFixed(2)}x` : "Not meaningful");
const pc = (v: number | null | undefined, d = 1) => (ok(v) ? `${(v * 100).toFixed(d)}%` : "Not meaningful");

const BLUE: [number, number, number] = [37, 99, 235];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const SOFT: [number, number, number] = [219, 234, 254];

export async function exportCapitalLabPdf(opts: { include: { caseStudy: boolean; simulator: boolean }; baseline: Baseline; assumptions: Assumptions; mode: "ril" | "custom" }) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 0;

  const table = (head: string[], body: (string | number)[][], kind?: string) => {
    if (kind) badge(kind);
    autoTable(doc, {
      startY: y, head: [head], body, margin: { left: M, right: M }, theme: "plain",
      styles: { fontSize: 9, cellPadding: 5, textColor: INK, lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 } },
      headStyles: { fillColor: SOFT, textColor: [30, 64, 175], fontStyle: "bold" },
      columnStyles: Object.fromEntries(head.map((_, i) => [i, { halign: i === 0 ? "left" : "right" }])),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  };
  const ensure = (h: number) => { if (y + h > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 56; } };
  const h1 = (t: string, eyebrow: string) => {
    ensure(60);
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...BLUE).text(eyebrow.toUpperCase(), M, y); y += 16;
    doc.setFontSize(18).setTextColor(...INK).text(t, M, y); y += 8;
    doc.setDrawColor(...BLUE).setLineWidth(1.5).line(M, y, M + 40, y); y += 20;
  };
  const h2 = (t: string) => { ensure(50); doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK).text(t, M, y); y += 14; };
  const para = (t: string, size = 9.5) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...MUTED);
    const lines = doc.splitTextToSize(t, W - 2 * M); ensure(lines.length * 13); doc.text(lines, M, y); y += lines.length * 13 + 8;
  };
  const badge = (t: string) => {
    ensure(30); doc.setFont("helvetica", "bold").setFontSize(7);
    const w = doc.getTextWidth(t.toUpperCase()) + 12;
    doc.setFillColor(...SOFT).roundedRect(M, y - 9, w, 13, 6, 6, "F");
    doc.setTextColor(30, 64, 175).text(t.toUpperCase(), M + 6, y); y += 12;
  };
  const kpis = (items: [string, string][]) => {
    ensure(64); const cols = items.length, gap = 8, w = (W - 2 * M - gap * (cols - 1)) / cols;
    items.forEach(([l, v], i) => {
      const x0 = M + i * (w + gap);
      doc.setDrawColor(226, 232, 240).setFillColor(248, 250, 252).roundedRect(x0, y, w, 52, 6, 6, "FD");
      doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED).text(doc.splitTextToSize(l, w - 16), x0 + 8, y + 14);
      doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...INK).text(v, x0 + 8, y + 42);
    });
    y += 66;
  };

  // Cover
  doc.setFillColor(...BLUE).rect(0, 0, W, 150, "F");
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(219, 234, 254).text("CAPITALLAB · DECISION REPORT", M, 54);
  doc.setFontSize(24).setTextColor(255, 255, 255).text(opts.include.caseStudy && opts.include.simulator ? "RIL 2020 Case & Scenario Analysis" : opts.include.caseStudy ? "RIL 2020 Rights Issue Case" : "Capital-Structure Scenario Report", M, 92);
  doc.setFont("helvetica", "normal").setFontSize(10).text(`Generated ${new Date().toLocaleString("en-IN")} · All figures in Rs. crore`, M, 118);
  y = 186;

  if (opts.include.caseStudy) {
    const R = RIL_RIGHTS, m = baseMetrics(RIL_BASELINE);
    h1("Reliance Industries — 2020 rights issue", "Historical case");
    kpis([["Net debt (Mar-20)", rs(RIL_FY20.netDebt)], ["Gross debt", rs(RIL_FY20.grossDebt)], ["EBITDA FY20", rs(RIL_FY20.ebitda)], ["Rights issue", rs(R.issueSize, 2)]]);
    h2("Baseline ratios (FY2019–20)");
    table(["Ratio", "Value", "Calculation"], [
      ["Net Debt / EBITDA", xx(m.ndEbitda), "1,61,035 / 1,02,280"], ["Gross Debt / EBITDA", xx(m.gdEbitda), "3,36,294 / 1,02,280"],
      ["Net Debt / Total Equity", pc(m.netGearing), "1,61,035 / 4,53,331"], ["Finance Cost / EBITDA", pc(m.fcEbitda), "22,027 / 1,02,280"], ["Cash / Gross Debt", pc(m.cashGd), "1,75,259 / 3,36,294"],
    ], "Calculated from reported data");
    h2("Transaction terms");
    table(["Item", "Detail"], [
      ["Issue size", rs(R.issueSize, 2)], ["Shares offered", n0.format(R.sharesOffered)], ["Issue price", "Rs. 1,257"], ["Rights ratio", "1 for every 15 eligible shares"],
      ["Record date", R.recordDate], ["Issue period", R.issuePeriod], ["Payment schedule", "Rs. 314.25 on application; Rs. 314.25 and Rs. 628.50 through later calls"],
      ["Overall / public subscription", "1.59x / 1.22x"], ["Net proceeds", rs(R.netProceeds, 2)], ["Debt repayment / prepayment", rs(R.debtRepayment, 2)], ["General corporate purposes", rs(R.generalCorporate, 2)],
    ], "Reported historical data");
    h2("Deleveraging impact");
    table(["Measure", "Result"], [
      ["Net proceeds designated for debt repayment", `${((R.debtRepayment / R.netProceeds) * 100).toFixed(2)}%`],
      ["Rights issue / March 2020 net debt", `${((R.issueSize / RIL_FY20.netDebt) * 100).toFixed(2)}%`],
      ["Debt repayment / March 2020 net debt", `${((R.debtRepayment / RIL_FY20.netDebt) * 100).toFixed(2)}%`],
    ], "Calculated from reported data");
    para("Key insight: The rights issue was a material deleveraging instrument, but it was not sufficient by itself to eliminate net debt. The broader reported capital-raising programme of Rs. 2,60,074 crore (rights issue plus asset monetisation) is a separate historical outcome and is not the proceeds of the rights issue alone. Goldman Sachs (India) Securities was one of the lead managers, not the sole executor.");
    h2("Timeline");
    table(["Date", "Event"], RIL_TIMELINE.map((t) => [t.date, `${t.title} — ${t.body.replace(/₹/g, "Rs. ")}`]));
  }

  if (opts.include.simulator) {
    if (opts.include.caseStudy) { doc.addPage(); y = 56; }
    const b = opts.baseline, a = opts.assumptions, r = runScenario(b, a), o = r.opening;
    h1(`Scenario analysis — ${b.name}`, opts.mode === "ril" ? "RIL FY2019–20 baseline · hypothetical scenario" : "Hypothetical company");
    kpis([["Pro-forma net debt", rs(r.pfNet)], ["ND / EBITDA", `${xx(o.ndEbitda)} -> ${xx(r.pfNdEbitda)}`], ["Finance cost", rs(r.pfFinance)], ["Dilution", pc(r.dilution, 2)]]);
    h2("Input assumptions");
    table(["Assumption", "Value"], [
      ["Equity raise", rs(a.equityRaise)], ["Issue price", `Rs. ${n2.format(a.issuePrice)}`], ["% of equity proceeds to debt repayment", `${a.pctEquityToDebt}%`],
      ["New borrowing", rs(a.newDebt)], ["Rate on new debt", `${a.newDebtRate}%`], ["Additional debt repayment", rs(a.debtRepay)], ["Rate saved on repaid debt", `${a.repaidDebtRate}%`],
      ["Asset monetisation", rs(a.assetSale)], ["EBITDA change", `${a.ebitdaChange}%`], ["Minimum cash reserve", rs(a.minCash)], ["Transaction costs", `${a.txnCostPct}%`],
      ["Capital need", rs(a.capitalNeed)], ["Use of proceeds", a.useOfProceeds || "Not specified"],
    ], "User-defined assumption");
    h2("Pro-forma results");
    table(["Metric", "Baseline", "Pro-forma", "Formula"], [
      ["Gross debt", rs(b.grossDebt), rs(r.pfGross), "Gross debt + new debt - repaid"],
      ["Cash", rs(b.cash), rs(r.pfCash), "Cash + net proceeds - repaid"],
      ["Net debt", rs(o.netDebt), rs(r.pfNet), "Gross debt - cash"],
      ["Net Debt / EBITDA", xx(o.ndEbitda), xx(r.pfNdEbitda), "Net debt / adj. EBITDA"],
      ["Gross Debt / EBITDA", xx(o.gdEbitda), xx(r.pfGdEbitda), "Gross debt / adj. EBITDA"],
      ["Net gearing", pc(o.netGearing), pc(r.pfGearing), "Net debt / equity"],
      ["Finance cost", rs(b.financeCost), rs(r.pfFinance), "Existing + new interest - saving"],
      ["Interest coverage", xx(o.interestCover), xx(r.pfInterestCover), "EBIT / finance cost"],
    ]);
    table(["Funding & dilution", "Value"], [
      ["Debt repaid", rs(r.repaid)], ["Transaction costs", rs(r.totalCosts)], ["New shares issued", `${n2.format(r.newSharesCr)} cr`],
      ["Dilution for non-subscribers", pc(r.dilution, 2)], ["Capital need funded", pc(r.fundedPct)], ["Remaining funding gap", rs(r.fundingGap)], ["Cash reserve surplus / (shortfall)", rs(r.reserveGap)],
    ]);
    if (r.warnings.length) { h2("Model warnings"); r.warnings.forEach((w) => para(`• ${w.replace(/₹/g, "Rs. ")}`)); }
    h2("Strategy comparison (same capital need)");
    table(["Strategy", "Net debt", "ND/EBITDA", "Finance cost", "Dilution"], [
      ["Current scenario", rs(r.pfNet), xx(r.pfNdEbitda), rs(r.pfFinance), pc(r.dilution, 2)],
      ...STRATEGIES.map((s) => { const q = runScenario(b, strategyAssumptions(s.key, a)); return [`${s.key}. ${s.name}`, rs(q.pfNet), xx(q.pfNdEbitda), rs(q.pfFinance), pc(q.dilution, 2)]; }),
    ], "Illustrative counterfactual");
    para(`Insight: At these assumptions the scenario ${r.netDebtChange <= 0 ? "reduces" : "increases"} net debt by ${rs(Math.abs(r.netDebtChange))} and moves Net Debt / EBITDA from ${xx(o.ndEbitda)} to ${xx(r.pfNdEbitda)}. In a rights issue, shareholders who fully exercise their entitlement preserve their proportional ownership.`);
  }

  h2("Sources");
  SOURCES.forEach((s) => para(`${s.n}. ${s.title} — ${s.url}`, 8.5));
  h2("Disclaimer");
  para(DISCLAIMER, 8.5);

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const H = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED);
    doc.text("CapitalLab · Educational decision-support report · Not investment advice", M, H - 28);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 28, { align: "right" });
  }
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`CapitalLab-${opts.include.caseStudy && !opts.include.simulator ? "RIL-Case" : opts.include.simulator && !opts.include.caseStudy ? "Scenario" : "Report"}-${stamp}.pdf`);
}
