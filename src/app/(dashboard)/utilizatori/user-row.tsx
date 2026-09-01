"use client";

import { useState, useTransition } from "react";
import { updateUserCenters, resetUserPassword, updateUserEmail } from "./actions";

interface Profile {
  id: string;
  full_name: string;
  role: "admin" | "center_head";
}

export function UserRow({
  profile,
  email,
  centers,
  assignedCenterIds,
}: {
  profile: Profile;
  email: string | null;
  centers: { id: string; nume: string }[];
  assignedCenterIds: string[];
}) {
  const [editingCenters, setEditingCenters] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const assignedNames = centers
    .filter((c) => assignedCenterIds.includes(c.id))
    .map((c) => c.nume)
    .join(", ");

  return (
    <>
      <tr>
        <td className="px-4 py-2 text-slate-900">{profile.full_name}</td>
        <td className="px-4 py-2 text-slate-600">{email ?? "—"}</td>
        <td className="px-4 py-2 text-slate-600">{profile.role === "admin" ? "Admin" : "Șef de centru"}</td>
        <td className="px-4 py-2 text-slate-600">
          {profile.role === "admin" ? "Toate" : assignedNames || "—"}
        </td>
        <td className="px-4 py-2 text-right text-sm">
          {profile.role === "center_head" && (
            <button
              onClick={() => setEditingCenters((v) => !v)}
              className="mr-3 font-medium text-indigo-600 hover:text-indigo-500"
            >
              Centre
            </button>
          )}
          <button
            onClick={() => setEditingEmail((v) => !v)}
            className="mr-3 font-medium text-indigo-600 hover:text-indigo-500"
          >
            Email
          </button>
          <button
            onClick={() => setResettingPassword((v) => !v)}
            className="font-medium text-slate-600 hover:text-slate-500"
          >
            Resetează parola
          </button>
        </td>
      </tr>

      {editingCenters && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-4 py-3">
            <form
              action={(formData) =>
                startTransition(async () => {
                  const res = await updateUserCenters(formData);
                  setMessage(res.error ?? "Actualizat.");
                  if (!res.error) setEditingCenters(false);
                })
              }
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="profileId" value={profile.id} />
              <div className="flex flex-wrap gap-2">
                {centers.map((c) => (
                  <label key={c.id} className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      name="centerIds"
                      value={c.id}
                      defaultChecked={assignedCenterIds.includes(c.id)}
                    />
                    {c.nume}
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500"
              >
                Salvează
              </button>
            </form>
          </td>
        </tr>
      )}

      {editingEmail && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-4 py-3">
            <form
              action={(formData) =>
                startTransition(async () => {
                  const res = await updateUserEmail(formData);
                  setMessage(res.error ?? "Email actualizat.");
                  if (!res.error) setEditingEmail(false);
                })
              }
              className="flex items-end gap-2"
            >
              <input type="hidden" name="userId" value={profile.id} />
              <div>
                <label className="block text-xs text-slate-500">Email nou</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={email ?? ""}
                  required
                  className="w-64 rounded border border-slate-300 px-2 py-1 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Salvează
              </button>
            </form>
          </td>
        </tr>
      )}

      {resettingPassword && (
        <tr>
          <td colSpan={5} className="bg-slate-50 px-4 py-3">
            <form
              action={(formData) =>
                startTransition(async () => {
                  const res = await resetUserPassword(formData);
                  setMessage(res.error ?? "Parolă actualizată.");
                  if (!res.error) setResettingPassword(false);
                })
              }
              className="flex items-end gap-2"
            >
              <input type="hidden" name="userId" value={profile.id} />
              <div>
                <label className="block text-xs text-slate-500">Parolă nouă</label>
                <input name="newPassword" type="text" minLength={6} required className="w-48 rounded border border-slate-300 px-2 py-1 text-sm" />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Salvează
              </button>
            </form>
          </td>
        </tr>
      )}

      {message && (
        <tr>
          <td colSpan={5} className="px-4 pb-2 text-xs text-slate-400">
            {message}
          </td>
        </tr>
      )}
    </>
  );
}
