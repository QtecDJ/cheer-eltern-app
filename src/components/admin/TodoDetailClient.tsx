"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import TodoDetail from "./TodoDetail";

export default function TodoDetailClientFallback({ currentUserId, roles }: { currentUserId?: number; roles?: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [todo, setTodo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const segs = (pathname || "").split('/').filter(Boolean);
    const id = segs.length ? segs[segs.length - 1] : null;
    if (!id) {
      setError('Ungültige Aufgaben-ID.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/admin/todos/${id}`);
        if (!res.ok) {
          setError('Aufgabe nicht gefunden.');
          setLoading(false);
          return;
        }
        const json = await res.json();
        setTodo(json.todo);
      } catch (e) {
        setError('Fehler beim Laden');
      } finally { setLoading(false); }
    })();
  }, [pathname]);

  if (loading) return <div className="py-6">Lade Aufgabe...</div>;
  if (error) return <div className="py-6">{error}</div>;
  if (!todo) return <div className="py-6">Aufgabe nicht gefunden.</div>;

  return (
    // @ts-ignore
    <TodoDetail todo={todo} currentUserId={currentUserId ?? todo.creatorId} roles={roles} />
  );
}
