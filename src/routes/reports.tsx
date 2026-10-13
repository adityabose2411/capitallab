import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/lab/AppShell";
import { PageHeader, Panel } from "@/components/lab/ui";
import { ExportPdfButton } from "@/components/lab/ExportPdfButton";
import { useLab } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [
    { title: "Reports — CapitalLab" },
    { name: "description", content: "Download polished PDF reports of the RIL case study and your simulator scenario." },
    { property: "og:title", content: "Reports — CapitalLab" },
    { property: "og:description", content: "Export the RIL 2020 case and scenario results as a PDF." },
  ] }),
  component: Page,
});

function Page() {
  const { baseline, saved } = useLab();
  return (
    <AppShell crumb="Reports">
      <PageHeader eyebrow="Export" title="Reports" description="Download formatted PDF reports. Simulator reports use your current scenario assumptions." />
      <div className="grid gap-4 md:grid-cols-3">
        <Panel title="Full report" subtitle="RIL case study plus your current scenario">
          <ExportPdfButton caseStudy simulator label="Download full PDF" />
        </Panel>
        <Panel title="RIL 2020 case study" subtitle="Terms, ratios, proceeds, timeline, sources">
          <ExportPdfButton caseStudy simulator={false} variant="outline" label="Download case PDF" />
        </Panel>
        <Panel title="Simulator results" subtitle={`Current scenario · ${baseline.name}`}>
          <ExportPdfButton caseStudy={false} simulator variant="outline" label="Download scenario PDF" />
        </Panel>
      </div>
      {saved.length > 0 && (
        <Panel title="Saved scenarios" className="mt-4">
          <ul className="space-y-1 text-sm">{saved.map((s) => <li key={s.id} className="flex justify-between border-b py-1.5"><span>{s.name}</span><span className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString("en-IN")}</span></li>)}</ul>
        </Panel>
      )}
    </AppShell>
  );
}
