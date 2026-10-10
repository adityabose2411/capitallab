import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/lab/AppShell";
import { PageHeader, Panel } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ipo-planner")({
  head: () => ({ meta: [
    { title: "IPO Planner — CapitalLab" },
    { name: "description", content: "Preliminary IPO valuation, proceeds, dilution and readiness." },
    { property: "og:title", content: "IPO Planner — CapitalLab" },
    { property: "og:description", content: "Preliminary IPO valuation, proceeds, dilution and readiness." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <AppShell crumb="IPO Planner">
      <PageHeader eyebrow="Coming next" title="IPO Planner" description="Preliminary IPO valuation, proceeds, dilution and readiness." />
      <Panel title="This module is not built yet">
        <p className="text-sm text-muted-foreground">The calculation engine for this module exists, but its workspace screen is still to be built. Meanwhile, use the simulator.</p>
        <Button asChild className="mt-4"><Link to="/simulator">Open simulator</Link></Button>
      </Panel>
    </AppShell>
  );
}
