"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";
import {
  ChefHat,
  Lock,
  Mail,
  ArrowRight,
  Sun,
  Moon,
  ShieldAlert,
  Utensils,
  Eye,
  EyeOff,
} from "lucide-react";

interface LoginScreenProps {
  onSuccess: (user: { id: string; email: string; name: string; role: string; permissions: string[] }) => void;
}

export function StaffLoginScreen({ onSuccess }: LoginScreenProps) {
  const { theme, setTheme } = useTheme();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.user);
      } else {
        setErrorMsg(data.error || "Email atau password salah.");
      }
    } catch {
      setErrorMsg("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-sm shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-display leading-none">
              Tyfel Hub
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mt-1">
              F&B Ops &amp; Culinary Economics
            </div>
          </div>
        </div>

        {/* Theme Mode Selector */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] shadow-2xs">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              theme === "light"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
              theme === "dark"
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Dark</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-8">
        <div className="cockpit-panel rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-[var(--border-strong)] relative overflow-hidden">
          {/* Accent Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] flex items-center justify-center shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold font-display text-[var(--text-primary)] tracking-tight">
              Staff &amp; Operations Login
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Area manajemen internal untuk unit economics, recipe COGS, kitchen throughput &amp; catering CRM.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="staff-email"
                className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@tyfelhub.id"
                  autoComplete="username"
                  autoFocus
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="staff-password"
                className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="staff-password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent-primary)] hover:opacity-90 active:scale-[0.99] text-white text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Buka Operations Command</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Hint */}
            <p className="text-center text-[11px] text-[var(--text-muted)]">
              Akun pertama:{" "}
              <span className="font-mono text-[var(--text-secondary)]">
                admin@tyfelhub.id
              </span>{" "}
              / password default di <span className="font-mono">SEED_ADMIN_PASSWORD</span>
            </p>
          </form>

          {/* Customer Portal Separation */}
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              <span>Pelanggan Katering Herbox?</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Jika Anda adalah pelanggan katering yang ingin melihat kalender atau request skip makan, silakan buka link portal pribadi Anda.
            </p>
            <Link
              href="/catering/portal"
              className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1.5 border border-[var(--border-default)] transition-colors"
            >
              <span>Buka Herbox Subscriber Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[var(--text-muted)] font-mono max-w-md mx-auto">
        Tyfel Hub · Greenville &amp; Kemang Outlets · Security Isolation Active
      </footer>
    </div>
  );
}
