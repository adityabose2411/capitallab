import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/lab/AppShell";
import { PageHeader, Panel } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ma-planner")({
  head: () => ({ meta: [
    { title: "M&A Planner — CapitalLab" },
    { name: "description", content: "Deal valuation, synergies and pro-forma leverage." },
    { property: "og:title", content: "M&A Planner — CapitalLab" },
    { property: "og:description", content: "Deal valuation, synergies and pro-forma leverage." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <AppShell crumb="M&A Planner">
      <PageHeader eyebrow="Coming next" title="M&A Planner" description="Deal valuation, synergies and pro-forma leverage." />
      <Panel title="This module is not built yet">
        <p className="text-sm text-muted-foreground">The calculation engine for this module exists, but its workspace screen is still to be built. Meanwhile, use the simulator.</p>
        <Button asChild className="mt-4"><Link to="/simulator">Open simulator</Link></Button>
      </Panel>
    </AppShell>
  );
}
