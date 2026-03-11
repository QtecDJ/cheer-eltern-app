"use client";
import React, { useEffect, useState } from "react";

interface Props {
  html: string;
  className?: string;
}

export default function RichTextDisplay({ html, className = "" }: Props) {
  const [clean, setClean] = useState<string>("");

  useEffect(() => {
    // DOMPurify only runs on the client
    import("dompurify").then(({ default: DOMPurify }) => {
      setClean(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }));
    });
  }, [html]);

  return (
    <div
      className={`rte-display [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-0.5 [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mb-1 [&_p]:mb-1 ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
