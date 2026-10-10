import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/lab/AppShell";
import { PageHeader, Panel } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/methodology")({
  head: () => ({ meta: [
    { title: "Methodology — CapitalLab" },
    { name: "description", content: "Formulas, definitions, data sources and limitations." },
    { property: "og:title", content: "Methodology — CapitalLab" },
    { property: "og:description", content: "Formulas, definitions, data sources and limitations." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <AppShell crumb="Methodology">
      <PageHeader eyebrow="Coming next" title="Methodology" description="Formulas, definitions, data sources and limitations." />
      <Panel title="This module is not built yet">
        <p className="text-sm text-muted-foreground">The calculation engine for this module exists, but its workspace screen is still to be built. Meanwhile, use the simulator.</p>
        <Button asChild className="mt-4"><Link to="/simulator">Open simulator</Link></Button>
      </Panel>
    </AppShell>
  );
}
