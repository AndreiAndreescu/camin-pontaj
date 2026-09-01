"use client";

import { useRef, useTransition } from "react";
import { addCenter } from "./actions";

export function AddCenterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          const res = await addCenter(formData);
          if (!res.error) formRef.current?.reset();
        })
      }
      className="mt-3 flex flex-wrap items-end gap-2"
    >
      <div>
        <label className="block text-xs text-slate-500">Nume</label>
        <input name="nume" required className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Cod</label>
        <input name="cod" className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Tip</label>
        <select name="tip" className="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="centru">Centru</option>
          <option value="apartament">Apartament</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500">Adresă</label>
        <input name="adresa" className="w-56 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Localitate</label>
        <input name="localitate" className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Județ</label>
        <input name="judet" className="w-28 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Capacitate</label>
        <input name="capacitate" type="number" className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
      >
        Adaugă
      </button>
    </form>
  );
}
