"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { CustomerPortalData, MealSlot } from "@/lib/catering";
import {
  Utensils,
  CheckCircle2,
  Ban,
  ArrowLeftRight,
  Clock,
  MapPin,
  Sparkles,
  Phone,
  AlertCircle,
  ChevronRight,
  Edit3,
  Save,
  X,
} from "lucide-react";

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${months[m] || parts[1]} ${parts[0]}`;
}

const INDONESIAN_DAYS: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

function getDayName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return INDONESIAN_DAYS[dow] || "";
}

export default function CustomerSelfServicePortal() {
  const params = useParams();
  const customerId = params?.customerId as string;

  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [mutating, setMutating] = useState<boolean>(false);

  // Skip Confirmation Dialog State
  const [pendingSkip, setPendingSkip] = useState<{
    date: string;
    slot: MealSlot;
  } | null>(null);

  // Edit Profile (Address & Dietary Notes) State
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileAddress, setProfileAddress] = useState("");
  const [profileDietary, setProfileDietary] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  function openEditProfile() {
    if (!data) return;
    setProfileAddress(data.customer.delivery_address || "");
    setProfileDietary(data.customer.dietary_notes || "");
    setProfilePhone(data.customer.phone || "");
    setEditProfileOpen(true);
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/catering/portal/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          delivery_address: profileAddress,
          dietary_notes: profileDietary,
          phone: profilePhone,
        }),
      });
      const json = await res.json();
      if (json.success && json.portalData) {
        setData(json.portalData);
        setEditProfileOpen(false);
        setActionNotice("Alamat pengiriman dan catatan menu berhasil diperbarui!");
        setTimeout(() => setActionNotice(null), 5000);
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function fetchPortalData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/catering/portal/${customerId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.success && json.portalData) {
        setData(json.portalData);
      }
    } catch (err) {
      console.error("Failed to load customer portal data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (customerId) fetchPortalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function handlePortalAction(
    date: string,
    slot: MealSlot,
    action: "skip" | "swap_slot"
  ) {
    setMutating(true);
    try {
      const res = await fetch(`/api/catering/portal/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          delivery_date: date,
          meal_slot: slot,
        }),
      });
      const json = await res.json();
      if (json.success && json.portalData) {
        setData(json.portalData);
        setPendingSkip(null);
        if (action === "skip") {
          setActionNotice(
            `Jadwal ${date} (${slot}) berhasil di-skip (OFF). Kuota box kamu tidak terpotong & otomatis diperpanjang ke ${formatShortDate(
              json.rolledOverToDate || ""
            )}!`
          );
        } else {
          setActionNotice(
            `Jadwal ${date} berhasil ditukar ke ${
              slot === "L" ? "Dinner (Malam)" : "Lunch (Siang)"
            }.`
          );
        }
        setTimeout(() => setActionNotice(null), 6000);
      }
    } finally {
      setMutating(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6 flex items-center justify-center">
        <div className="cockpit-panel rounded-2xl p-8 text-center max-w-sm w-full space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            Memuat Portal Katering Pribadi...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] p-4 sm:p-6 flex items-center justify-center">
        <div className="cockpit-panel rounded-2xl p-8 text-center max-w-md w-full space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            Profil Pelanggan Tidak Ditemukan
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            ID atau link katering tidak valid. Silakan hubungi tim Herbox jika Anda membutuhkan bantuan.
          </p>
          <a
            href="https://wa.me/6281190234412?text=Halo%20Herbox,%20saya%20butuh%20bantuan%20link%20portal%20katering%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
          >
            <Phone className="w-4 h-4" />
            <span>Chat WhatsApp Herbox Concierge</span>
          </a>
        </div>
      </div>
    );
  }

  const { customer, active_package, upcoming_deliveries, cutoff_info } = data;
  const sisa = customer.active_boxes_left_to_deliver;
  const total = customer.active_quota_total || 1;
  const pctUsed = Math.min(100, Math.round(((total - sisa) / total) * 100));

  const waAdminUrl = `https://wa.me/6281190234412?text=${encodeURIComponent(
    `Halo Admin Herbox, saya ${customer.customer_name} (ID: ${customer.customer_id}). Saya ingin konsultasi seputar jadwal katering / perpanjang paket saya.`
  )}`;

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] font-bold">
                Herbox Personal Catering
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] font-display">
                Subscriber Portal
              </div>
            </div>
          </div>
          <span className="badge-emerald px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold">
            Personal Portal
          </span>
        </div>

        {/* Feedback Alert Toast */}
        {actionNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* 1. Subscriber Identity & Active Quota Card */}
        <div className="cockpit-panel rounded-2xl p-5 space-y-4 border-emerald-500/30 accent-bar-emerald">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-[var(--text-primary)]">
                  Halo, Kak {customer.customer_name}!
                </h1>
                <span className="badge-emerald px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold">
                  {customer.category_label}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {active_package?.package_name || "Personal Catering Plan"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 tabular-nums">
                {sisa}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">
                Sisa Box Quota
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
              <span>
                Terpakai: {total - sisa} dari {total} box
              </span>
              <span>
                Estimasi Selesai:{" "}
                <strong className="text-[var(--text-primary)]">
                  {formatShortDate(customer.projected_last_date || "")}
                </strong>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-surface-3)] overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${pctUsed}%` }}
              />
            </div>
          </div>

          {/* Delivery Address & Dietary Notes */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Info Pengiriman & Pantangan Menu
              </span>
              <button
                type="button"
                onClick={openEditProfile}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Ubah</span>
              </button>
            </div>
            <div className="space-y-1.5 text-[var(--text-secondary)]">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{customer.delivery_address || "Alamat belum tercatat"}</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{customer.dietary_notes || "Tidak ada catatan khusus / alergi"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Cutoff Notice & Fair Flexibility Card */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Aturan Cutoff & Fleksibilitas Skip Makan</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {cutoff_info.description}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-amber-500/20">
              <span className="text-[var(--text-muted)] block text-[10px]">
                Cutoff Siang (Lunch):
              </span>
              <strong className="text-[var(--text-primary)]">
                {cutoff_info.lunch_cutoff_hour}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-amber-500/20">
              <span className="text-[var(--text-muted)] block text-[10px]">
                Cutoff Malam (Dinner):
              </span>
              <strong className="text-[var(--text-primary)]">
                {cutoff_info.dinner_cutoff_hour}
              </strong>
            </div>
          </div>
        </div>

        {/* 3. Upcoming Scheduled Meals Feed */}
        <div className="cockpit-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] font-display">
                Jadwal Pengiriman Mendatang
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Kelola atau skip tanggal makan kamu dengan 1-klik di bawah ini.
              </p>
            </div>
            <span className="badge-neutral px-2 py-0.5 rounded text-[10px] font-mono">
              {upcoming_deliveries.length} Slot
            </span>
          </div>

          <div className="space-y-2.5">
            {upcoming_deliveries.map((item) => {
              const dayName = getDayName(item.delivery_date);
              const isLunch = item.meal_slot === "L";
              const isOff = item.status === "skipped";

              return (
                <div
                  key={item.delivery_id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOff
                      ? "bg-amber-500/10 border-amber-500/30 opacity-75"
                      : "bg-[var(--bg-surface-2)] border-[var(--border-default)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-primary)]">
                          {dayName}, {formatShortDate(item.delivery_date)}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded ${
                            isLunch ? "badge-amber" : "badge-purple"
                          }`}
                        >
                          {isLunch ? "☀️ Lunch" : "🌙 Dinner"}
                        </span>
                        {isOff && (
                          <span className="badge-rose px-2 py-0.2 rounded text-[10px] font-mono font-bold">
                            OFF (DI-SKIP)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {isOff
                          ? "Tanggal ini di-skip · Kuota box kamu otomatis dialihkan ke hari berikutnya."
                          : item.menu_note ||
                            (customer.category === "LAUK"
                              ? "Lauk Only (Protein & Sayur)"
                              : "Herbox Superfood Ricebox")}
                      </div>
                    </div>

                    {!isOff && item.box_qty > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={mutating}
                          onClick={() =>
                            handlePortalAction(
                              item.delivery_date,
                              item.meal_slot,
                              "swap_slot"
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-3)] border border-[var(--border-default)] text-[11px] font-mono font-semibold text-[var(--text-secondary)] inline-flex items-center gap-1 cursor-pointer"
                          title="Tukar jam makan siang ke malam atau sebaliknya"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500" />
                          <span className="hidden sm:inline">Tukar L/D</span>
                        </button>

                        <button
                          type="button"
                          disabled={mutating}
                          onClick={() =>
                            setPendingSkip({
                              date: item.delivery_date,
                              slot: item.meal_slot,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/40 text-[11px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Skip (OFF)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. WhatsApp Help & Renewal Contact Card */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>Butuh Bantuan atau Mau Perpanjang Paket?</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Hubungi Concierge Herbox via WhatsApp untuk request khusus atau top-up box katering.
            </p>
          </div>
          <a
            href={waAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <span>Chat WhatsApp Herbox</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Skip Confirmation Modal */}
        {pendingSkip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="cockpit-panel rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <Ban className="w-5 h-5" />
                <span>Konfirmasi Skip Tanggal Makan?</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Kamu akan men-skip pengiriman pada{" "}
                <strong>
                  {getDayName(pendingSkip.date)},{" "}
                  {formatShortDate(pendingSkip.date)} (
                  {pendingSkip.slot === "L" ? "Siang" : "Malam"})
                </strong>
                .
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
                ✅ <strong>Kuota box kamu aman!</strong> 1 box katering kamu
                akan otomatis dialihkan ke hari pengiriman berikutnya sehingga
                tidak ada box yang hangus.
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingSkip(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-2)]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() =>
                    handlePortalAction(
                      pendingSkip.date,
                      pendingSkip.slot,
                      "skip"
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500"
                >
                  {mutating ? "Menyimpan..." : "Ya, Skip Tanggal Ini"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <form
              onSubmit={handleProfileSave}
              className="cockpit-panel rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-[var(--border-strong)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] font-display">
                      Ubah Info Pengiriman & Catatan
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Perubahan otomatis terhubung langsung ke dapur & kurir
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
                    Alamat Pengiriman Lengkap
                  </label>
                  <textarea
                    rows={3}
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Contoh: Jl. Greenville Blok AY No. 12, Jakarta Barat (titip di security)"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-emerald-500 leading-relaxed resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
                    Catatan Pantangan Menu / Alergi
                  </label>
                  <input
                    type="text"
                    value={profileDietary}
                    onChange={(e) => setProfileDietary(e.target.value)}
                    placeholder="Contoh: Tanpa pedas, saus dressing dipisah, alergi seafood"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] font-semibold">
                    Nomor WhatsApp Penerima
                  </label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-200">
                ⚠️ <strong>Catatan:</strong> Perubahan alamat berlaku efektif untuk pengiriman berikutnya sesuai jam cutoff dapur (10:30 WIB Siang / 15:30 WIB Malam).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-2)] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
