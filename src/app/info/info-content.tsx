"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, ClipboardCheck } from "lucide-react";
import Link from "next/link";

export function InfoContent() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
      {/* Header */}
      <header className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold">Info</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verwaltung und Übersicht
        </p>
      </header>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
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
