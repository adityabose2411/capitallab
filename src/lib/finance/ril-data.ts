// Reported historical data — RIL FY2019–20 (consolidated, ₹ crore) and 2020 rights issue.
// Frozen: never mutate. User assumptions live in separate state.

export const RIL_FY20 = Object.freeze({
  name: "Reliance Industries Limited",
  period: "FY2019–20 (31 March 2020)",
  grossDebt: 336294,
  cash: 175259,
  netDebt: 161035,
  ebitda: 102280,
  financeCost: 22027,
  capex: 77444,
  totalEquity: 453331,
  // Pre-rights shares derived from 1:15 ratio × 42,26,26,894 offered (crore shares)
  sharesCr: (422626894 * 15) / 1e7,
});

export const RIL_RIGHTS = Object.freeze({
  issueSize: 53124.2,
  sharesOffered: 422626894,
  issuePrice: 1257,
  ratio: "1 for every 15",
  recordDate: "14 May 2020",
  issuePeriod: "20 May – 3 June 2020",
  initialPayment: 314.25,
  laterCalls: [314.25, 628.5],
  subscription: 1.59,
  publicSubscription: 1.22,
  netProceeds: 53036.13,
  debtRepayment: 39755.08,
  generalCorporate: 13281.05,
  broaderProgramme: 260074,
});

export const RIL_TIMELINE = [
  { date: "30 Apr 2020", title: "Board approves rights issue", body: "Rights issue of up to ₹53,124.20 crore at ₹1,257 per share announced alongside FY20 results." },
  { date: "14 May 2020", title: "Record date", body: "Eligibility fixed: 1 rights share for every 15 shares held." },
  { date: "20 May 2020", title: "Issue opens", body: "Partly-paid shares; ₹314.25 (25%) payable on application." },
  { date: "3 Jun 2020", title: "Issue closes", body: "Reported overall subscription of 1.59×." },
  { date: "2020–21", title: "Later calls", body: "Remaining ₹314.25 and ₹628.50 per share collected through subsequent calls." },
];

export const SOURCES = [
  { n: 1, title: "Reliance Industries Limited, Integrated Annual Report 2019–20", url: "https://www.ril.com/ar2019-20/index.html" },
  { n: 2, title: "Reliance Industries Limited, FY2019–20 Management Discussion and Analysis", url: "https://www.ril.com/ar2019-20/mda.html" },
  { n: 3, title: "Reliance Industries Limited, Letter to Shareholders — 2020 rights issue", url: "https://www.ril.com/ar2019-20/letter-to-shareholders.html" },
  { n: 4, title: "Reliance Industries Limited, FY2020–21 Financial Capital", url: "https://www.ril.com/ar2020-21/financial-capital.html" },
  { n: 5, title: "Goldman Sachs India", url: "https://www.goldmansachs.com/worldwide/india/about-gs-india" },
  { n: 6, title: "Goldman Sachs, Reliance Industries rights issue", url: "https://www.goldmansachs.com/worldwide/india/ipo/reliance-industries-limited" },
  { n: 7, title: "Reserve Bank of India, Annual Report 2019–20", url: "https://www.rbi.org.in/scripts/AnnualReportPublications.aspx?Id=1287" },
  { n: 8, title: "SEBI rights-issue documentation and relevant circulars", url: "https://www.sebi.gov.in" },
];

export const DISCLAIMER =
  "CapitalLab is an educational corporate-finance decision-support tool. Historical case figures are used for academic analysis. Scenario results depend on user-entered assumptions and simplified financial models. Outputs are not investment advice, a formal valuation opinion, an offer document, legal advice or a substitute for professional financial, accounting, tax or regulatory diligence.";
