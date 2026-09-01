"use client";

import { useMemo, useState, useTransition } from "react";
import { isWeekend, calculeazaSugestii } from "@/lib/pontaj-calc";
import { saveTimesheet, setTimesheetStatus, type DayInput } from "./actions";

export function TimesheetEditor({
  centerId,
  employeeId,
  an,
  luna,
  initialDays,
  absenceCodes,
  status: initialStatus,
  updatedByName,
  updatedAt,
}: {
  centerId: string;
  employeeId: string;
  an: number;
  luna: number;
  initialDays: DayInput[];
  absenceCodes: { code: string; label: string }[];
  status: "in_lucru" | "finalizat";
  canFinalize: boolean;
  updatedByName?: string | null;
  updatedAt?: string | null;
}) {
  const [days, setDays] = useState<DayInput[]>(initialDays);
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const readOnly = status === "finalizat";

  const totals = useMemo(() => {
    return days.reduce(
      (acc, d) => {
        acc.lucrate += d.oreLucrate ?? 0;
        acc.suplimentare += d.oreSuplimentare;
        acc.noapte += d.oreNoapte;
        acc.sambata += d.oreSambata;
        acc.duminica += d.oreDuminica;
        acc.absente += d.codAbsenta ? 1 : 0;
        return acc;
      },
      { lucrate: 0, suplimentare: 0, noapte: 0, sambata: 0, duminica: 0, absente: 0 }
    );
  }, [days]);

  function updateDay(ziua: number, patch: Partial<DayInput>) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.ziua !== ziua) return d;
        const next = { ...d, ...patch };

        // Re-calculează sugestiile automate când se schimbă orele/programul, dar
        // doar dacă utilizatorul nu a corectat deja manual (păstrăm simplu: recalculăm mereu
        // când se schimbă oreLucrate/oraInceput/oraSfarsit, corecțiile manuale ulterioare rămân).
        if ("oreLucrate" in patch || "oraInceput" in patch || "oraSfarsit" in patch) {
          const sugestii = calculeazaSugestii({
            oreLucrate: next.oreLucrate,
            oraInceput: next.oraInceput,
            oraSfarsit: next.oraSfarsit,
          });
          next.oreSuplimentare = sugestii.oreSuplimentare;
          next.oreNoapte = sugestii.oreNoapte;
        }

        const { sambata, duminica } = isWeekend(an, luna, ziua);
        next.oreSambata = sambata && next.oreLucrate ? next.oreLucrate : 0;
        next.oreDuminica = duminica && next.oreLucrate ? next.oreLucrate : 0;

        if (patch.codAbsenta) {
          // O zi de absență nu are ore lucrate.
          next.oreLucrate = null;
          next.oraInceput = null;
          next.oraSfarsit = null;
          next.oreSuplimentare = 0;
          next.oreNoapte = 0;
          next.oreSambata = 0;
          next.oreDuminica = 0;
        }

        return next;
      })
    );
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const res = await saveTimesheet({ centerId, employeeId, an, luna, days });
      setMessage(res.error ?? "Salvat.");
    });
  }

  function handleFinalize(next: "finalizat" | "in_lucru") {
    setMessage(null);
    startTransition(async () => {
      await saveTimesheet({ centerId, employeeId, an, luna, days });
      const res = await setTimesheetStatus({ centerId, employeeId, an, luna, status: next });
      if (!res.error) setStatus(next);
      setMessage(res.error ?? (next === "finalizat" ? "Pontaj finalizat." : "Pontaj redeschis."));
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            status === "finalizat" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {status === "finalizat" ? "Finalizat" : "În lucru"}
        </span>

        {updatedByName && updatedAt && (
          <span className="text-xs text-slate-400">
            Ultima editare: {updatedByName} ·{" "}
            {new Date(updatedAt).toLocaleString("ro-RO", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}

        <div className="flex gap-2">
          {message && <span className="self-center text-sm text-slate-500">{message}</span>}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              Salvează
            </button>
          )}
          <button
            onClick={() => handleFinalize(readOnly ? "in_lucru" : "finalizat")}
            disabled={isPending}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {readOnly ? "Redeschide" : "Finalizează luna"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-2 py-2 font-medium">Ziua</th>
              <th className="px-2 py-2 font-medium">Start</th>
              <th className="px-2 py-2 font-medium">Stop</th>
              <th className="px-2 py-2 font-medium">Ore lucrate</th>
              <th className="px-2 py-2 font-medium">OS</th>
              <th className="px-2 py-2 font-medium">ON</th>
              <th className="px-2 py-2 font-medium">SA</th>
              <th className="px-2 py-2 font-medium">DU</th>
              <th className="px-2 py-2 font-medium">Absență</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {days.map((d) => {
              const { sambata, duminica } = isWeekend(an, luna, d.ziua);
              return (
                <tr key={d.ziua} className={sambata || duminica ? "bg-rose-50/40" : undefined}>
                  <td className="px-2 py-1 font-medium text-slate-700">{d.ziua}</td>
                  <td className="px-2 py-1">
                    <input
                      type="time"
                      disabled={readOnly}
                      value={d.oraInceput ?? ""}
                      onChange={(e) => updateDay(d.ziua, { oraInceput: e.target.value || null })}
                      className="w-24 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="time"
                      disabled={readOnly}
                      value={d.oraSfarsit ?? ""}
                      onChange={(e) => updateDay(d.ziua, { oraSfarsit: e.target.value || null })}
                      className="w-24 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      disabled={readOnly}
                      value={d.oreLucrate ?? ""}
                      onChange={(e) =>
                        updateDay(d.ziua, {
                          oreLucrate: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      className="w-16 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.5"
                      disabled={readOnly}
                      value={d.oreSuplimentare}
                      onChange={(e) => updateDay(d.ziua, { oreSuplimentare: Number(e.target.value) || 0 })}
                      className="w-14 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      step="0.5"
                      disabled={readOnly}
                      value={d.oreNoapte}
                      onChange={(e) => updateDay(d.ziua, { oreNoapte: Number(e.target.value) || 0 })}
                      className="w-14 rounded border border-slate-200 px-1 py-0.5 text-xs disabled:bg-slate-50"
                    />
                  </td>
                  <td className="px-2 py-1 text-center text-slate-500">{d.oreSambata || (sambata ? "—" : "")}</td>
                  <td className="px-2 py-1 text-center text-slate-500">{d.oreDuminica || (duminica ? "—" : "")}</td>
                  <td className="px-2 py-1">
                    <select
                      disabled={readOnly}
                      value={d.codAbsenta ?? ""}
                      onChange={(e) => updateDay(d.ziua, { codAbsenta: e.target.value || null })}
                      className="rounded border border-slate-200 px-1 py-0.5 text-xs disabled:bg-slate-50"
                    >
                      <option value="">—</option>
                      {absenceCodes.map((c) => (
                        <option key={c.code} value={c.code} title={c.label}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-medium text-slate-700">
            <tr>
              <td className="px-2 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-2 py-2">{totals.lucrate}</td>
              <td className="px-2 py-2">{totals.suplimentare}</td>
              <td className="px-2 py-2">{totals.noapte}</td>
              <td className="px-2 py-2">{totals.sambata}</td>
              <td className="px-2 py-2">{totals.duminica}</td>
              <td className="px-2 py-2">{totals.absente} zile</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Legendă absențe: {absenceCodes.map((c) => `${c.code} = ${c.label}`).join(" · ")}
      </p>
    </div>
  );
}
