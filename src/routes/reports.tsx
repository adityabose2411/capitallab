import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/lab/AppShell";
import { PageHeader, Panel } from "@/components/lab/ui";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [
    { title: "Reports — CapitalLab" },
    { name: "description", content: "Saved scenario summaries and downloadable reports." },
    { property: "og:title", content: "Reports — CapitalLab" },
    { property: "og:description", content: "Saved scenario summaries and downloadable reports." },
  ] }),
  component: Page,
});

function Page() {
  return (
    <AppShell crumb="Reports">
      <PageHeader eyebrow="Coming next" title="Reports" description="Saved scenario summaries and downloadable reports." />
      <Panel title="This module is not built yet">
        <p className="text-sm text-muted-foreground">The calculation engine for this module exists, but its workspace screen is still to be built. Meanwhile, use the simulator.</p>
        <Button asChild className="mt-4"><Link to="/simulator">Open simulator</Link></Button>
      </Panel>
    </AppShell>
  );
}
