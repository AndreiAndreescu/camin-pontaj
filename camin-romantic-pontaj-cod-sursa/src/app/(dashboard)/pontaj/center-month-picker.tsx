"use client";

import { useRouter } from "next/navigation";
import { LUNI_RO } from "@/lib/pontaj-calc";

export function CenterMonthPicker({
  centers,
  selectedCenterId,
  an,
  luna,
}: {
  centers: { id: string; nume: string }[];
  selectedCenterId?: string;
  an: number;
  luna: number;
}) {
  const router = useRouter();

  function update(next: Partial<{ center: string; an: number; luna: number }>) {
    const params = new URLSearchParams({
      center: next.center ?? selectedCenterId ?? "",
      an: String(next.an ?? an),
      luna: String(next.luna ?? luna),
    });
    router.push(`/pontaj?${params.toString()}`);
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <select
        value={selectedCenterId}
        onChange={(e) => update({ center: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        {centers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nume}
          </option>
        ))}
      </select>

      <select
        value={luna}
        onChange={(e) => update({ luna: Number(e.target.value) })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        {LUNI_RO.map((l, i) => (
          <option key={l} value={i + 1}>
            {l}
          </option>
        ))}
      </select>

      <select
        value={an}
        onChange={(e) => update({ an: Number(e.target.value) })}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
