import { getSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const users = await prisma.user.findMany({
    where: {
      companyId: session.companyId,
      ...(isAdmin(session.role) ? {} : { id: session.id }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      callsMade: true,
      conversions: true,
      active: true,
    },
  });

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
