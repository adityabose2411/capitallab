import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLab } from "@/lib/store";

export function ExportPdfButton({ caseStudy, simulator, label = "Export PDF", variant = "default" }: { caseStudy: boolean; simulator: boolean; label?: string; variant?: "default" | "outline" }) {
  const { baseline, assumptions, mode } = useLab();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant={variant} disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        const { exportCapitalLabPdf } = await import("@/lib/report-pdf");
        await exportCapitalLabPdf({ include: { caseStudy, simulator }, baseline, assumptions, mode });
        toast.success("PDF report downloaded");
      } catch (e) {
        console.error(e);
        toast.error("Could not generate the PDF. Please try again.");
      } finally { setBusy(false); }
    }}>
      {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}{label}
    </Button>
  );
}
