import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, BookOpen, Briefcase, Compass, FileText, GitMerge, LayoutDashboard, Landmark, Menu, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLab } from "@/lib/store";
import { DISCLAIMER } from "@/lib/finance/ril-data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/case-study/ril-2020", label: "RIL 2020 Case", icon: Landmark },
  { to: "/simulator", label: "Simulator", icon: SlidersHorizontal },
  { to: "/strategy-planner", label: "Strategy Planner", icon: Compass },
  { to: "/ipo-planner", label: "IPO Planner", icon: Briefcase },
  { to: "/ma-planner", label: "M&A Planner", icon: GitMerge },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/methodology", label: "Methodology", icon: BookOpen },
] as const;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
        <BarChart3 className="h-4 w-4" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">CapitalLab</span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-0.5">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = path === to;
        return (
          <Link key={to} to={to} onClick={onNavigate}
            className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ crumb, children }: { crumb: string; children: ReactNode }) {
  const { mode, set, resetRil, startCustom, baseline } = useLab();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar p-4 lg:flex">
        <Logo />
        <div className="mt-8 flex-1"><NavList /></div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">Educational tool. Not investment advice.</p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <Logo />
              <div className="mt-6"><NavList onNavigate={() => setOpen(false)} /></div>
            </SheetContent>
          </Sheet>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Link to="/" className="hover:text-foreground">CapitalLab</Link><span>/</span>
            <span className="truncate font-medium text-foreground">{crumb}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className={cn("hidden rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider md:inline-flex",
              mode === "ril" ? "bg-primary-soft text-accent-foreground" : "bg-caution-soft text-caution")}>
              {mode === "ril" ? "Historical base · FY2019–20" : "Hypothetical company"}
            </span>
            <Select value={mode} onValueChange={(v) => (v === "ril" ? resetRil() : mode === "custom" ? null : startCustom())}>
              <SelectTrigger className="h-8 w-[200px] text-xs" aria-label="Company"><SelectValue>{baseline.name}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="ril">Reliance Industries (FY20)</SelectItem>
                <SelectItem value="custom">Custom company</SelectItem>
              </SelectContent>
            </Select>
            {mode === "custom" && <Button size="sm" variant="ghost" className="hidden text-xs md:inline-flex" onClick={() => set({ mode: "custom" })}>Editing</Button>}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6">{children}</main>
        <footer className="border-t bg-background px-6 py-4 text-[11px] leading-relaxed text-muted-foreground">{DISCLAIMER}</footer>
      </div>
    </div>
  );
}
