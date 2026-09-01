"use client";

import { useRef, useTransition } from "react";
import { addEmployee } from "./actions";

export function AddEmployeeForm({ centerId }: { centerId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await addEmployee(formData);
      if (!res.error) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="centerId" value={centerId} />
      <div>
        <label className="block text-xs text-slate-500">Nume</label>
        <input name="nume" required className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Funcție</label>
        <input name="functie" required className="w-40 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Email</label>
        <input name="email" type="email" className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-slate-500">Telefon</label>
        <input name="telefon" className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" />
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
