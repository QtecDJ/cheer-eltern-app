import { useEffect, useRef } from "react";

interface PDFViewerProps {
  url: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Fokus auf das PDF setzen, wenn geladen
    if (iframeRef.current) {
      iframeRef.current.focus();
    }
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      title="PDF Dokument"
      width="100%"
      height="700px"
      style={{ border: "none", borderRadius: 12, background: "#fff" }}
      allowFullScreen
    />
  );
}
