"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LUNI_RO } from "@/lib/pontaj-calc";

export function ExportForm({ centers }: { centers: { id: string; nume: string }[] }) {
  const router = useRouter();
  const now = new Date();
  const [scope, setScope] = useState<"toate" | string>("toate");
  const [an, setAn] = useState(now.getFullYear());
  const [luna, setLuna] = useState(now.getMonth() + 1);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  function handleGenerate() {
    const params = new URLSearchParams({ scope, an: String(an), luna: String(luna) });
    router.push(`/print?${params.toString()}`);
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-slate-500">Centru</label>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="toate">Toată asociația</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nume}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500">Luna</label>
        <select value={luna} onChange={(e) => setLuna(Number(e.target.value))} className="rounded border border-slate-300 px-2 py-1 text-sm">
          {LUNI_RO.map((l, i) => (
            <option key={l} value={i + 1}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500">An</label>
        <select value={an} onChange={(e) => setAn(Number(e.target.value))} className="rounded border border-slate-300 px-2 py-1 text-sm">
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleGenerate}
        className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Generează
      </button>
    </div>
  );
}
