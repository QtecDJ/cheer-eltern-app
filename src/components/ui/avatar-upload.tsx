"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  name: string;
  currentPhotoUrl?: string | null;
  onUploadComplete: (url: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  size?: "md" | "lg" | "xl";
  className?: string;
}

// Farben basierend auf dem Namen generieren
function getColorFromName(name: string): string {
  const colors = [
    "bg-pink-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
    "bg-rose-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Initialen aus Namen extrahieren
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AvatarUpload({
  name,
  currentPhotoUrl,
  onUploadComplete,
  onDelete,
  size = "xl",
  className,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const displayUrl = previewUrl || currentPhotoUrl;

  const sizeClasses = {
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setShowMenu(false);

    // Lokale Vorschau erstellen
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload fehlgeschlagen");
      }

      // URL in der Datenbank speichern
      await onUploadComplete(data.url);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Hochladen");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    
    setShowMenu(false);
    setIsUploading(true);
    
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Avatar */}
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isUploading}
        className={cn(
          "relative rounded-full overflow-hidden flex items-center justify-center text-white font-semibold shrink-0 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          bgColor,
          sizeClasses[size],
          isUploading && "opacity-70"
        )}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}

        {/* Upload Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}

        {/* Camera Badge */}
        {!isUploading && (
          <div className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-md">
            <Camera className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        )}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dropdown Menu */}
      {showMenu && !isUploading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden min-w-[160px]">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Foto hochladen
            </button>
            
            {currentPhotoUrl && onDelete && (
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted text-destructive flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Foto entfernen
              </button>
            )}
            
            <button
              onClick={() => setShowMenu(false)}
              className="w-full px-4 py-2.5 text-sm text-left hover:bg-muted text-muted-foreground flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </button>
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-destructive/10 text-destructive text-xs rounded-lg whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
