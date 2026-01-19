"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardCheck, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function InfoContent() {
  const router = useRouter();
  
  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-lg md:max-w-none mx-auto">
      {/* Header */}
      <header className="mb-6 md:mb-8 animate-fade-in">
        <button onClick={() => router.back()} className="text-primary text-sm mb-2 hover:underline md:hidden">
          ← Zurück
        </button>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Info</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Verwaltung und Übersicht
        </p>
      </header>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Mitglieder Info Card */}
        <Link href="/info/mitglieder">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Mitglieder Info</h3>
                  <p className="text-sm text-muted-foreground">
                    Notfall- und Gesundheitsinfos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Anwesenheit Card */}
        <Link href="/info/anwesenheit">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <ClipboardCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Anwesenheit</h3>
                  <p className="text-sm text-muted-foreground">
                    Anwesenheitsliste verwalten
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
