"use client";

import { useRouter } from "next/navigation";

export function CenterFilter({
  centers,
  selectedCenterId,
}: {
  centers: { id: string; nume: string }[];
  selectedCenterId?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={selectedCenterId}
      onChange={(e) => router.push(`/angajati?center=${e.target.value}`)}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
    >
      {centers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nume}
        </option>
      ))}
    </select>
  );
}
