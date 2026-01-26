"use client";

import { useState } from "react";
import { DokumenteContent } from "./dokumente-content";
import { BerichteContent } from "../berichte/berichte-content";

export default function DokumenteTabs() {
  const [tab, setTab] = useState<"docs" | "reports">("docs");

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-lg md:max-w-none mx-auto">
      <div className="mb-6 md:mb-8">
        <div className="flex gap-2">
          <button
            className={"px-3 py-2 rounded-md text-sm font-medium " + (tab === "docs" ? "bg-primary/10 text-primary" : "text-muted-foreground bg-transparent")}
            onClick={() => setTab("docs")}
          >
            Dokumente
          </button>
          <button
            className={"px-3 py-2 rounded-md text-sm font-medium " + (tab === "reports" ? "bg-primary/10 text-primary" : "text-muted-foreground bg-transparent")}
            onClick={() => setTab("reports")}
          >
            Berichte
          </button>
        </div>
      </div>

      <div>
        {tab === "docs" ? <DokumenteContent embedded={true} /> : <BerichteContent />}
      </div>
    </div>
  );
}
