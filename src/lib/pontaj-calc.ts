import { getDaysInMonth, getDay } from "date-fns";

/** 0 = Sunday ... 6 = Saturday (JS convention, matches date-fns getDay). */
export function isWeekend(an: number, luna: number, ziua: number) {
  const dow = getDay(new Date(an, luna - 1, ziua));
  return { sambata: dow === 6, duminica: dow === 0 };
}

export function daysInMonth(an: number, luna: number) {
  return getDaysInMonth(new Date(an, luna - 1, 1));
}

const PROGRAM_NORMAL_ORE = 8;

/**
 * Sugestii automate (editabile de utilizator) pentru orele suplimentare/de noapte,
 * pe baza orelor lucrate și a intervalului orar introdus.
 */
export function calculeazaSugestii({
  oreLucrate,
  oraInceput,
  oraSfarsit,
}: {
  oreLucrate: number | null;
  oraInceput: string | null;
  oraSfarsit: string | null;
}) {
  if (oreLucrate == null) {
    return { oreSuplimentare: 0, oreNoapte: 0 };
  }

  const oreSuplimentare = Math.max(0, oreLucrate - PROGRAM_NORMAL_ORE);

  let oreNoapte = 0;
  if (oraInceput && oraSfarsit) {
    const startH = Number(oraInceput.split(":")[0]);
    const endH = Number(oraSfarsit.split(":")[0]);
    const inTuraNoapte = startH >= 22 || startH < 6 || endH <= 6 || endH === 0;
    if (inTuraNoapte) oreNoapte = oreLucrate;
  }

  return { oreSuplimentare, oreNoapte };
}

export const LUNI_RO = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];
