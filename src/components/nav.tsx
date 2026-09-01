"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/login/actions";
import type { ProfileRole } from "@/lib/types/database";

const LINKS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/pontaj", label: "Pontaj" },
  { href: "/angajati", label: "Angajați" },
  { href: "/centre", label: "Centre", adminOnly: true },
  { href: "/utilizatori", label: "Utilizatori", adminOnly: true },
  { href: "/export", label: "Export", adminOnly: true },
];

export function Nav({
  fullName,
  role,
}: {
  fullName: string;
  role: ProfileRole;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">Pontaj Cămin Romantic</span>
          <nav className="flex gap-1">
            {LINKS.filter((l) => !l.adminOnly || role === "admin").map((l) => {
              const active = pathname?.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>
            {fullName}{" "}
            <span className="text-slate-400">
              ({role === "admin" ? "admin" : "șef centru"})
            </span>
          </span>
          <form action={signOut}>
            <button className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
              Ieșire
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
