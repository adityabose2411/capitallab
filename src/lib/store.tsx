import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CUSTOM_DEFAULT_ASSUMPTIONS, CUSTOM_DEFAULT_BASELINE, RIL_BASELINE, RIL_DEFAULT_ASSUMPTIONS,
  type Assumptions, type Baseline,
} from "./finance/scenario";
import { EMPTY_ANSWERS, type Answers } from "./finance/strategy";
import { IPO_DEFAULTS, type IpoInputs } from "./finance/ipo";
import { MA_DEFAULTS, type MaInputs } from "./finance/ma";

export type CompanyMode = "ril" | "custom";
export type SavedScenario = { id: string; name: string; createdAt: string; mode: CompanyMode; baseline: Baseline; assumptions: Assumptions };

type State = {
  mode: CompanyMode;
  customBaseline: Baseline;
  assumptions: Assumptions;
  saved: SavedScenario[];
  answers: Answers;
  step: number;
  submitted: boolean;
  ipo: IpoInputs;
  ma: MaInputs;
};

const initial: State = {
  mode: "ril",
  customBaseline: { ...CUSTOM_DEFAULT_BASELINE },
  assumptions: { ...RIL_DEFAULT_ASSUMPTIONS },
  saved: [],
  answers: { ...EMPTY_ANSWERS },
  step: 0,
  submitted: false,
  ipo: { ...IPO_DEFAULTS },
  ma: { ...MA_DEFAULTS },
};

type Ctx = State & {
  baseline: Baseline;
  set: (patch: Partial<State>) => void;
  setAssumption: <K extends keyof Assumptions>(k: K, v: Assumptions[K]) => void;
  resetRil: () => void;
  startCustom: () => void;
  saveScenario: (name: string) => void;
  deleteScenario: (id: string) => void;
};

const LabCtx = createContext<Ctx | null>(null);
const KEY = "capitallab:v1";

export function LabProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch { /* ignore corrupt storage */ }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (loaded.current) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }));
  const value: Ctx = {
    ...state,
    baseline: state.mode === "ril" ? RIL_BASELINE : state.customBaseline,
    set,
    setAssumption: (k, v) => setState((s) => ({ ...s, assumptions: { ...s.assumptions, [k]: v } })),
    resetRil: () => set({ mode: "ril", assumptions: { ...RIL_DEFAULT_ASSUMPTIONS } }),
    startCustom: () => set({ mode: "custom", customBaseline: { ...CUSTOM_DEFAULT_BASELINE }, assumptions: { ...CUSTOM_DEFAULT_ASSUMPTIONS } }),
    saveScenario: (name) =>
      setState((s) => ({
        ...s,
        saved: [
          { id: `${Date.now()}`, name, createdAt: new Date().toISOString(), mode: s.mode, baseline: s.mode === "ril" ? RIL_BASELINE : s.customBaseline, assumptions: s.assumptions },
          ...s.saved,
        ],
      })),
    deleteScenario: (id) => setState((s) => ({ ...s, saved: s.saved.filter((x) => x.id !== id) })),
  };
  return <LabCtx.Provider value={value}>{children}</LabCtx.Provider>;
}

export function useLab() {
  const c = useContext(LabCtx);
  if (!c) throw new Error("useLab must be used inside LabProvider");
  return c;
}
