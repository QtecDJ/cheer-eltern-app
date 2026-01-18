"use client";

import { Card } from "@/components/ui/card";
import { FileText, Download, ExternalLink } from "lucide-react";

const reports = [
  {
    id: "cmtb",
    title: "CMT 26 Bericht",
    description: "Der offizielle Abschlussbericht der CMT 2026 – alle Highlights, Ergebnisse und Einblicke als PDF zum Download.",
    filename: "https://web.icacheer.space/documents/cmtb.pdf",
    isExternal: true
  },
];

export function BerichteContent() {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id} className="flex items-center gap-4 p-4">
          <FileText className="w-8 h-8 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base truncate">{report.title}</div>
            <div className="text-sm text-muted-foreground truncate">{report.description}</div>
          </div>
          <a
            href={report.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="PDF öffnen"
          >
            <Download className="w-4 h-4" />
            PDF
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Card>
      ))}
    </div>
  );
}
