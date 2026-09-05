"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        password: fd.get("password"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Giriş başarısız");
      return;
    }
    router.push("/pipeline");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
            Online VIP CRM
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Giriş yap</h1>
          <p className="mt-1 text-sm text-slate-500">
            Demo: admin@onlinevipdershane.com / demo1234
          </p>
        </div>
        <label className="mb-3 block text-sm font-medium">
          E-posta
          <input
            name="email"
            type="email"
            required
            defaultValue="admin@onlinevipdershane.com"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-sky-500 focus:ring-2"
          />
        </label>
        <label className="mb-4 block text-sm font-medium">
          Şifre
          <input
            name="password"
            type="password"
            required
            defaultValue="demo1234"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none ring-sky-500 focus:ring-2"
          />
        </label>
        {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 py-2.5 font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? "Giriş..." : "Giriş Yap"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Yeni şirket?{" "}
          <Link href="/register" className="font-medium text-sky-600">
            Kayıt ol
          </Link>
        </p>
      </form>
    </div>
  );
}
