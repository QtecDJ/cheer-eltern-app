"use client";

import { Card } from "@/components/ui/card";
import { FileText, Download, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: string;
  isExternal?: boolean; // Für externe Links wie OneDrive
}

// Beispiel-Dokumente - später aus DB oder API laden
const documents: Document[] = [
  {
    id: "1",
    title: "Packliste",
    description: "Packliste für Wettkämpfe und Events",
    filename: "https://web.icacheer.space/documents/Packliste.pdf",
    category: "Cheer",
    isExternal: true
  },
  {
    id: "2",
    title: "Uniform und Auftritts Anweisung",
    description: "Anleitung zur Uniform und Verhalten bei Auftritten",
    filename: "https://web.icacheer.space/documents/icauniform.pdf",
    category: "Cheer",
    isExternal: true
  },
  {
    id: "3",
    title: "Schmink Video",
    description: "Anleitung zum Schminken für Auftritte und Events",
    filename: "https://web.icacheer.space/documents/vid1.mp4",
    category: "Cheer",
    isExternal: true
  },
];

export function DokumenteContent() {
  const router = useRouter();

  const getDownloadUrl = (filename: string, isExternal?: boolean) => {
    if (isExternal) {
      return filename;
    }
    return `/documents/${filename}`;
  };

  const handleOpen = (doc: Document) => {
    const url = getDownloadUrl(doc.filename, doc.isExternal);
    window.open(url, '_blank');
  };

  const handleDownload = (doc: Document) => {
    const url = getDownloadUrl(doc.filename, doc.isExternal);
    
    // Für Videos: Download-Attribut funktioniert nicht bei externen URLs
    // Daher öffnen wir sie einfach in neuem Tab
    const fileExtension = doc.filename.split('.').pop()?.toLowerCase();
    const isVideo = fileExtension === 'mp4' || fileExtension === 'mov' || fileExtension === 'avi';
    
    if (isVideo) {
      // Bei Videos muss der Browser selbst den Download-Dialog anzeigen
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = doc.title + '.' + fileExtension;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        })
        .catch(() => {
          // Fallback: Öffne in neuem Tab
          window.open(url, '_blank');
        });
    } else {
      // Für PDFs funktioniert das download-Attribut
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.title + '.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Gruppiere Dokumente nach Kategorie
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-lg md:max-w-none mx-auto">
      {/* Header */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline md:hidden">
          ← Zurück
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Dokumente</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          PDFs und wichtige Dokumente
        </p>
      </header>

      {/* Dokumente nach Kategorie */}
      <div className="space-y-6 md:space-y-8">
        {Object.entries(groupedDocuments).map(([category, docs]) => (
          <div key={category}>
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-muted-foreground">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {docs.map((doc) => (
                <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-4 md:p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {doc.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
                        onClick={() => handleOpen(doc)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Öffnen
                      </button>
                      <button
                        className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info-Box wenn keine Dokumente vorhanden */}
      {documents.length === 0 && (
        <Card className="mt-8">
          <div className="p-6 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Noch keine Dokumente verfügbar
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
