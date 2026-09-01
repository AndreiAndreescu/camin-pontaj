"use client";

import { useState, useTransition } from "react";
import { updateEmployee, archiveEmployee, removeEmployeeFromCenter } from "./actions";

interface Employee {
  id: string;
  nume: string;
  functie: string;
  email: string | null;
  telefon: string | null;
}

export function EmployeeRow({ employee, centerId }: { employee: Employee; centerId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-3">
          <form
            action={(formData) =>
              startTransition(async () => {
                await updateEmployee(formData);
                setEditing(false);
              })
            }
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="id" value={employee.id} />
            <div>
              <label className="block text-xs text-slate-500">Nume</label>
              <input name="nume" defaultValue={employee.nume} className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Funcție</label>
              <input name="functie" defaultValue={employee.functie} className="w-40 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Email</label>
              <input name="email" defaultValue={employee.email ?? ""} className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Telefon</label>
              <input name="telefon" defaultValue={employee.telefon ?? ""} className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Salvează
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
            >
              Anulează
            </button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-2 text-slate-900">{employee.nume}</td>
      <td className="px-4 py-2 text-slate-600">{employee.functie}</td>
      <td className="px-4 py-2 text-slate-600">{employee.email ?? "—"}</td>
      <td className="px-4 py-2 text-slate-600">{employee.telefon ?? "—"}</td>
      <td className="px-4 py-2 text-right text-sm">
        <button onClick={() => setEditing(true)} className="mr-3 font-medium text-indigo-600 hover:text-indigo-500">
          Editează
        </button>
        <form
          action={(formData) =>
            startTransition(async () => {
              await removeEmployeeFromCenter(formData);
            })
          }
          className="inline"
        >
          <input type="hidden" name="employeeId" value={employee.id} />
          <input type="hidden" name="centerId" value={centerId} />
          <button
            type="submit"
            disabled={isPending}
            onClick={(e) => {
              if (!confirm(`Scoateți ${employee.nume} din acest centru?`)) e.preventDefault();
            }}
            className="font-medium text-red-600 hover:text-red-500"
          >
            Scoate din centru
          </button>
        </form>
        <form
          action={(formData) =>
            startTransition(async () => {
              await archiveEmployee(formData);
            })
          }
          className="ml-3 inline"
        >
          <input type="hidden" name="id" value={employee.id} />
          <button
            type="submit"
            disabled={isPending}
            onClick={(e) => {
              if (!confirm(`Arhivați complet ${employee.nume} (din toate centrele)?`)) e.preventDefault();
            }}
            className="font-medium text-slate-400 hover:text-slate-600"
          >
            Arhivează
          </button>
        </form>
      </td>
    </tr>
  );
}
