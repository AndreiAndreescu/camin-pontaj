"use client";

import { useState, useTransition } from "react";
import { updateCenter, archiveCenter } from "./actions";

interface Center {
  id: string;
  nume: string;
  cod: string | null;
  tip: string;
  localitate: string | null;
  capacitate: number | null;
}

export function CenterRow({ center }: { center: Center }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3">
          <form
            action={(formData) =>
              startTransition(async () => {
                await updateCenter(formData);
                setEditing(false);
              })
            }
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="id" value={center.id} />
            <div>
              <label className="block text-xs text-slate-500">Nume</label>
              <input name="nume" defaultValue={center.nume} className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Cod</label>
              <input name="cod" defaultValue={center.cod ?? ""} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Localitate</label>
              <input name="localitate" defaultValue={center.localitate ?? ""} className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Capacitate</label>
              <input name="capacitate" type="number" defaultValue={center.capacitate ?? ""} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <button type="submit" disabled={isPending} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
              Salvează
            </button>
            <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600">
              Anulează
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-2 text-slate-900">{center.nume}</td>
      <td className="px-4 py-2 text-slate-600">{center.cod ?? "—"}</td>
      <td className="px-4 py-2 text-slate-600">{center.tip === "apartament" ? "Apartament" : "Centru"}</td>
      <td className="px-4 py-2 text-slate-600">{center.localitate ?? "—"}</td>
      <td className="px-4 py-2 text-slate-600">{center.capacitate ?? "—"}</td>
      <td className="px-4 py-2 text-right text-sm">
        <button onClick={() => setEditing(true)} className="mr-3 font-medium text-indigo-600 hover:text-indigo-500">
          Editează
        </button>
        <form
          action={(formData) =>
            startTransition(async () => {
              await archiveCenter(formData);
            })
          }
          className="inline"
        >
          <input type="hidden" name="id" value={center.id} />
          <button
            type="submit"
            disabled={isPending}
            onClick={(e) => {
              if (!confirm(`Arhivați centrul ${center.nume}?`)) e.preventDefault();
            }}
            className="font-medium text-red-600 hover:text-red-500"
          >
            Arhivează
          </button>
        </form>
      </td>
    </tr>
  );
}
