"use client";

import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-sm w-full text-center p-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Etwas ist schiefgelaufen</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Es gab ein Problem beim Laden der Mitglieder-Daten. Bitte versuche es erneut.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Erneut versuchen
        </button>
      </Card>
    </div>
  );
}
