import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/lab/AppShell";
import { PageHeader, Panel } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/strategy-planner")({
  head: () => ({ meta: [
    { title: "Strategy Planner — CapitalLab" },
    { name: "description", content: "Questionnaire-driven financing and strategy recommendation." },
    { property: "og:title", content: "Strategy Planner — CapitalLab" },
    { property: "og:description", content: "Questionnaire-driven financing and strategy recommendation." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <AppShell crumb="Strategy Planner">
      <PageHeader eyebrow="Coming next" title="Strategy Planner" description="Questionnaire-driven financing and strategy recommendation." />
      <Panel title="This module is not built yet">
        <p className="text-sm text-muted-foreground">The calculation engine for this module exists, but its workspace screen is still to be built. Meanwhile, use the simulator.</p>
        <Button asChild className="mt-4"><Link to="/simulator">Open simulator</Link></Button>
      </Panel>
    </AppShell>
  );
}
