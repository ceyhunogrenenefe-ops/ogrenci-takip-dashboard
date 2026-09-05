"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  callsMade: number;
  conversions: number;
  active: boolean;
};

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/team", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Ekip</h1>
      <p className="mb-6 text-sm text-slate-500">Rol bazlı kullanıcılar</p>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Arama</th>
              <th className="px-4 py-3">Kayıt</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.callsMade}</td>
                <td className="px-4 py-3">{u.conversions}</td>
                <td className="px-4 py-3">{u.active ? "Aktif" : "Pasif"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
