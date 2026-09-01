"use client";

import { useRef, useState, useTransition } from "react";
import { createUser } from "./actions";

export function CreateUserForm({ centers }: { centers: { id: string; nume: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [role, setRole] = useState<"admin" | "center_head">("center_head");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await createUser(formData);
      setMessage(res.error ?? "Cont creat.");
      if (!res.error) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-3 space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-slate-500">Nume complet</label>
          <input name="fullName" required className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Email</label>
          <input name="email" type="email" required className="w-56 rounded border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Parolă inițială</label>
          <input name="password" type="text" minLength={6} required className="w-40 rounded border border-slate-300 px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Rol</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "center_head")}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="center_head">Șef de centru</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {role === "center_head" && (
        <div>
          <label className="block text-xs text-slate-500">Centre gestionate</label>
          <div className="mt-1 flex max-w-2xl flex-wrap gap-2">
            {centers.map((c) => (
              <label key={c.id} className="flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs">
                <input type="checkbox" name="centerIds" value={c.id} />
                {c.nume}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          Creează cont
        </button>
        {message && <span className="text-sm text-slate-500">{message}</span>}
      </div>
    </form>
  );
}
