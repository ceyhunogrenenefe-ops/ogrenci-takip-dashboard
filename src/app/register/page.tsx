"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: fd.get("companyName"),
        name: fd.get("name"),
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Kayıt başarısız");
      return;
    }
    router.push("/pipeline");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold">Şirket kaydı</h1>
        <p className="mt-1 text-sm text-slate-500">Multi-tenant SaaS başlangıcı</p>
        <div className="mt-6 space-y-3">
          <input name="companyName" required placeholder="Şirket adı" className="w-full rounded-lg border px-3 py-2" />
          <input name="name" required placeholder="Adınız" className="w-full rounded-lg border px-3 py-2" />
          <input name="email" type="email" required placeholder="E-posta" className="w-full rounded-lg border px-3 py-2" />
          <input name="password" type="password" required minLength={6} placeholder="Şifre" className="w-full rounded-lg border px-3 py-2" />
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button disabled={loading} className="mt-4 w-full rounded-lg bg-sky-600 py-2.5 font-semibold text-white">
          {loading ? "Oluşturuluyor..." : "Hesabı oluştur"}
        </button>
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-sky-600">
            Girişe dön
          </Link>
        </p>
      </form>
    </div>
  );
}
