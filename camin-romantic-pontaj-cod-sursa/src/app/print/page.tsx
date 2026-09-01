import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadExportData, ASOCIATIE, ABSENCE_LEGEND } from "@/lib/export-data";
import { daysInMonth, LUNI_RO } from "@/lib/pontaj-calc";
import { PrintButton } from "./print-button";

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; an?: string; luna?: string }>;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const sp = await searchParams;

  const an = Number(sp.an) || new Date().getFullYear();
  const luna = Number(sp.luna) || new Date().getMonth() + 1;
  const scope = sp.scope || "toate";

  let centerIds: string[];
  if (scope === "toate") {
    const { data } = await supabase.from("centers").select("id").eq("activ", true);
    centerIds = (data ?? []).map((c) => c.id);
  } else {
    centerIds = [scope];
  }

  const { sections, totalLucrate, totalNelucrate } = await loadExportData({ centerIds, an, luna });
  const zile = Array.from({ length: daysInMonth(an, luna) }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-[1400px] bg-white p-6 text-[10px] leading-tight text-slate-900 print:p-0">
      <div className="mb-3 flex items-center justify-between print:hidden">
        <p className="text-sm text-slate-500">Previzualizare — folosiți Printare/Salvare ca PDF din browser.</p>
        <PrintButton />
      </div>

      <header className="mb-2">
        <p className="font-semibold">{ASOCIATIE.nume}</p>
        <p>
          c.f. {ASOCIATIE.cif} r.c. Capital social {ASOCIATIE.capitalSocial}
        </p>
        <p>{ASOCIATIE.adresa}</p>
        <h1 className="mt-2 text-sm font-bold underline">FOAIE COLECTIVA DE PREZENTA</h1>
        <p className="font-semibold">
          {LUNI_RO[luna - 1]} {an}
        </p>
      </header>

      <p className="mb-3 text-[9px] text-slate-600">
        {ABSENCE_LEGEND.map(([code, label]) => `${code} - ${label}`).join(" · ")}
      </p>

      {sections.map((section) => (
        <section key={section.centerName} className="mb-6 break-inside-avoid">
          <h2 className="mb-1 font-bold uppercase">{section.centerName}</h2>
          <table className="w-full border-collapse border border-slate-400 text-[9px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-1 py-0.5">Nume și funcție</th>
                {zile.map((z) => (
                  <th key={z} className="border border-slate-300 px-1 py-0.5 text-center">{z}</th>
                ))}
                <th className="border border-slate-300 px-1 py-0.5">Total ore lucrate</th>
                <th className="border border-slate-300 px-1 py-0.5">OS</th>
                <th className="border border-slate-300 px-1 py-0.5">ON</th>
                <th className="border border-slate-300 px-1 py-0.5">SA</th>
                <th className="border border-slate-300 px-1 py-0.5">DU</th>
                <th className="border border-slate-300 px-1 py-0.5">Zile absență (cod)</th>
              </tr>
            </thead>
            {section.employees.map((emp) => {
                const totOS = emp.days.reduce((s, d) => s + d.oreSuplimentare, 0);
                const totON = emp.days.reduce((s, d) => s + d.oreNoapte, 0);
                const totSA = emp.days.reduce((s, d) => s + d.oreSambata, 0);
                const totDU = emp.days.reduce((s, d) => s + d.oreDuminica, 0);
                const codeCounts = new Map<string, number>();
                for (const d of emp.days) {
                  if (d.codAbsenta) codeCounts.set(d.codAbsenta, (codeCounts.get(d.codAbsenta) ?? 0) + 1);
                }
                const codeSummary = Array.from(codeCounts.entries())
                  .map(([code, n]) => `${code}:${n}`)
                  .join(" ");

                return (
                  <tbody key={emp.nume}>
                    <tr key={emp.nume + "-start"}>
                      <td rowSpan={3} className="border border-slate-300 px-1 py-0.5 align-top">
                        <div className="font-medium">{emp.nume}</div>
                        <div className="text-slate-500">{emp.functie}</div>
                      </td>
                      {emp.days.map((d) => (
                        <td key={d.ziua} className={`border border-slate-300 px-0.5 text-center ${d.oreSambata || d.oreDuminica ? "bg-rose-50" : ""}`}>
                          {d.oraInceput?.slice(0, 5) ?? ""}
                        </td>
                      ))}
                      <td rowSpan={3} className="border border-slate-300 px-1 text-center align-middle">{emp.totalOreLucrate || ""}</td>
                      <td rowSpan={3} className="border border-slate-300 px-1 text-center align-middle">{totOS || ""}</td>
                      <td rowSpan={3} className="border border-slate-300 px-1 text-center align-middle">{totON || ""}</td>
                      <td rowSpan={3} className="border border-slate-300 px-1 text-center align-middle">{totSA || ""}</td>
                      <td rowSpan={3} className="border border-slate-300 px-1 text-center align-middle">{totDU || ""}</td>
                      <td rowSpan={3} className="border border-slate-300 px-1 text-center align-middle">{codeSummary || ""}</td>
                    </tr>
                    <tr key={emp.nume + "-stop"}>
                      {emp.days.map((d) => (
                        <td key={d.ziua} className={`border border-slate-300 px-0.5 text-center ${d.oreSambata || d.oreDuminica ? "bg-rose-50" : ""}`}>
                          {d.oraSfarsit?.slice(0, 5) ?? ""}
                        </td>
                      ))}
                    </tr>
                    <tr key={emp.nume + "-ore"}>
                      {emp.days.map((d) => (
                        <td key={d.ziua} className={`border border-slate-300 px-0.5 text-center ${d.oreSambata || d.oreDuminica ? "bg-rose-50" : ""}`}>
                          {d.codAbsenta ?? d.oreLucrate ?? ""}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                );
              })}
              {section.employees.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={zile.length + 7} className="border border-slate-300 px-2 py-2 text-center text-slate-400">
                      Niciun angajat.
                    </td>
                  </tr>
                </tbody>
              )}
          </table>
        </section>
      ))}

      <footer className="mt-4 flex justify-between text-[10px]">
        <span>Întocmit ....................................</span>
        <span>
          Total ore lucrate: <strong>{totalLucrate}</strong> &nbsp;&nbsp; Total zile absență: <strong>{totalNelucrate}</strong>
        </span>
      </footer>

      <style>{`
        @media print {
          @page { size: A3 landscape; margin: 8mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
