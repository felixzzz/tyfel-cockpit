"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  Phone,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";

export default function CustomerPortalLookupPage() {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  // Demo shortcut customers for fast test access
  const DEMO_CUSTOMERS = [
    { id: "CUST-FINA", name: "Fina", plan: "56 Box Extended Plan", phone: "0812-9988-7711" },
    { id: "CUST-YOLA", name: "Yola", plan: "5 Days · 5 Box Plan", phone: "0818-4455-6677" },
    { id: "CUST-RENNY", name: "Renny", plan: "20 Box Monthly Plan", phone: "0813-2233-4455" },
    { id: "CUST-IVAN", name: "Ivan", plan: "5 Days · 10 Box Plan", phone: "0811-3344-5566" },
  ];

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, "");
    if (!clean) return;

    setSearching(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/catering");
      const json = await res.json();
      if (json.success && json.data?.customers) {
        const found = json.data.customers.find((c: { phone: string; customer_id: string }) => {
          const cClean = (c.phone || "").replace(/\D/g, "");
          return cClean.includes(clean) || clean.includes(cClean);
        });

        if (found) {
          router.push(`/catering/portal/${found.customer_id}`);
          return;
        }
      }
      setErrorMsg("Nomor WhatsApp belum terdaftar di katering Herbox. Silakan periksa kembali atau chat admin.");
    } catch {
      setErrorMsg("Gagal memeriksa nomor. Silakan coba lagi.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between p-4 sm:p-6">
      {/* Top Brand Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] font-bold">
              Herbox
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)] font-display">
              Personal Catering
            </div>
          </div>
        </div>
        <span className="badge-emerald px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold">
          Subscriber Portal
        </span>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto my-8 space-y-6">
        <div className="cockpit-panel rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border border-[var(--border-strong)]">
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-bold font-display text-[var(--text-primary)]">
              Masuk ke Portal Katering Anda
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Cek sisa kuota box, atur kalender pengiriman harian, atau ajukan skip tanggal makan (OFF) secara mandiri.
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
                Nomor WhatsApp Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={searching || !phoneInput.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {searching ? (
                <span>Mencari data...</span>
              ) : (
                <>
                  <span>Buka Jadwal Katering Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
              <span>Akses Cepat Pelanggan Demo:</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CUSTOMERS.map((dc) => (
                <button
                  key={dc.id}
                  type="button"
                  onClick={() => router.push(`/catering/portal/${dc.id}`)}
                  className="p-2 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-subtle)] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-xs text-[var(--text-primary)]">
                    {dc.name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                    {dc.plan}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WhatsApp Help Card */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-[var(--text-secondary)]">
              Butuh link langsung ke portal katering Anda?
            </span>
          </div>
          <a
            href="https://wa.me/6281190234412?text=Halo%20Herbox,%20minta%20link%20portal%20katering%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            Chat Concierge
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[var(--text-muted)] font-mono max-w-md mx-auto">
        Herbox Healthy Nutrition · Dedicated Subscriber Engine
      </footer>
    </div>
  );
}
