"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { getBrandTheme } from "@/lib/brandTheme";
import { StaffLoginScreen } from "./StaffLoginScreen";
import {
  LayoutDashboard,
  Users,
  Database,
  Sun,
  Moon,
  ChefHat,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Scale,
  CalendarRange,
  Lock,
} from "lucide-react";

const BRAND_LINKS = [
  { name: "American Breakfast Club", shortName: "ABC", slug: "american-breakfast-club" },
  { name: "LA Breakfast Club", shortName: "LABC", slug: "la-breakfast-club" },
  { name: "Tyfel Coffee", shortName: "Tyfel Coffee", slug: "tyfel-coffee" },
  { name: "People Pasta", shortName: "People Pasta", slug: "people-pasta" },
  { name: "Herbox", shortName: "Herbox", slug: "herbox" },
];

function NavigationContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Preserve outlet & date filters when navigating between Overview and Brand pages
  const filterParams = new URLSearchParams();
  const branch = searchParams.get("branch");
  const range = searchParams.get("range");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (branch && branch !== "all") filterParams.set("branch", branch);
  if (range && range !== "all") filterParams.set("range", range);
  if (from) filterParams.set("from", from);
  if (to) filterParams.set("to", to);
  const qs = filterParams.toString() ? `?${filterParams.toString()}` : "";

  const isOverview = pathname === "/";
  const isRecipes = pathname.startsWith("/recipes");
  const isCatering = pathname.startsWith("/catering");
  const isAttendance = pathname.startsWith("/attendance");
  const isIngest = pathname.startsWith("/ingest");

  return (
    <div className="flex flex-col flex-1 justify-between overflow-y-auto px-3 py-4 space-y-6">
      {/* Primary Workspaces */}
      <div className="space-y-6">
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold">
              Operations Command
            </div>
          )}
          <nav className="space-y-1">
            <Link
              href={`/${qs}`}
              onClick={onNavigate}
              title="Executive Overview"
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isOverview
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span>Executive Overview</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isOverview
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                    }`}
                  >
                    Live
                  </span>
                </div>
              )}
            </Link>

            <Link
              href={`/recipes${qs}`}
              onClick={onNavigate}
              title="Recipes, BOM & Ingredient COGS Intelligence"
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isRecipes
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
              }`}
            >
              <Scale className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span>Recipes & COGS</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isRecipes
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                    }`}
                  >
                    BOM
                  </span>
                </div>
              )}
            </Link>

            <Link
              href="/catering"
              onClick={onNavigate}
              title="Herbox Personal Catering CRM & Flexible Schedule Matrix"
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isCatering
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
              }`}
            >
              <CalendarRange className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span>Herbox Catering</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isCatering
                        ? "bg-white/20 text-white"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    CRM
                  </span>
                </div>
              )}
            </Link>

            <Link
              href="/attendance"
              onClick={onNavigate}
              title="Payroll & Attendance (16–15)"
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isAttendance
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span>Staff & Payslips</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isAttendance
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                    }`}
                  >
                    16–15
                  </span>
                </div>
              )}
            </Link>

            <Link
              href="/ingest"
              onClick={onNavigate}
              title="Data Sync & CSV Ingest"
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isIngest
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span>Data Sync</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isIngest
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                    }`}
                  >
                    CSV
                  </span>
                </div>
              )}
            </Link>
          </nav>
        </div>

        {/* Culinary Concepts Direct Matrix */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold">
              <span>Culinary Concepts</span>
              <span>5 Brands</span>
            </div>
          )}
          <nav className="space-y-1">
            {BRAND_LINKS.map((b) => {
              const bTheme = getBrandTheme(b.slug);
              const isBrandActive = pathname === `/brands/${b.slug}`;
              return (
                <Link
                  key={b.slug}
                  href={`/brands/${b.slug}${qs}`}
                  onClick={onNavigate}
                  title={`${b.name} — ${bTheme.conceptTag}`}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all border ${
                    isBrandActive
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] font-semibold shadow-sm"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: bTheme.primaryColor,
                      boxShadow: isBrandActive ? `0 0 10px ${bTheme.primaryColor}` : "none",
                    }}
                  />
                  {!collapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <div className="truncate">
                        <div className="truncate leading-tight">{b.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                          {bTheme.conceptTag}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isBrandActive
                            ? "text-[var(--text-primary)] translate-x-0.5"
                            : "text-[var(--text-muted)] opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Outlet Telemetry Pill */}
      {!collapsed && (
        <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Active Kitchens
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div className="px-2 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="font-semibold text-[var(--text-primary)]">Greenville</div>
              <div className="text-[var(--text-muted)]">SLA ≤15m</div>
            </div>
            <div className="px-2 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="font-semibold text-[var(--text-primary)]">Kemang</div>
              <div className="text-[var(--text-muted)]">SLA ≤12m</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean | null>(null);

  const isCustomerPortal = pathname.startsWith("/catering/portal");

  useEffect(() => {
    if (isCustomerPortal) return;

    // Fast check: check localStorage first
    const localAuth =
      typeof window !== "undefined" &&
      localStorage.getItem("fnb_ops_staff_auth_v1") === "true";

    if (localAuth) {
      setIsStaffAuthenticated(true);
    } else {
      fetch("/api/auth/staff")
        .then((r) => r.json())
        .then((d) => {
          const auth = Boolean(d.authenticated);
          setIsStaffAuthenticated(auth);
          if (auth && typeof window !== "undefined") {
            localStorage.setItem("fnb_ops_staff_auth_v1", "true");
          }
        })
        .catch(() => setIsStaffAuthenticated(false));
    }
  }, [pathname, isCustomerPortal]);

  async function handleStaffLogout() {
    try {
      await fetch("/api/auth/staff", { method: "DELETE" });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("fnb_ops_staff_auth_v1");
    }
    setIsStaffAuthenticated(false);
  }

  // 1. DEDICATED CUSTOMER PORTAL (Pure standalone layout, Zero Admin Menus)
  if (isCustomerPortal) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
        {children}
      </div>
    );
  }

  // 2. LOADING STATE FOR ADMIN OPERATIONS
  if (isStaffAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 3. STAFF PASSCODE LOCK SCREEN FOR ADMIN OPERATIONS
  if (!isStaffAuthenticated) {
    return <StaffLoginScreen onSuccess={() => setIsStaffAuthenticated(true)} />;
  }

  const getPageLabel = () => {
    if (pathname === "/") return "Executive Portfolio Command";
    if (pathname.startsWith("/recipes")) return "Culinary Economics · Recipe & Ingredient COGS Command";
    if (pathname.startsWith("/catering")) return "Herbox · Personal Catering CRM & Flexible Schedule Engine";
    if (pathname.startsWith("/brands/")) {
      const slug = pathname.replace("/brands/", "");
      const b = getBrandTheme(slug);
      return `Concept Telemetry · ${b.name}`;
    }
    if (pathname.startsWith("/attendance")) return "Tyfel Coffee · Payroll & Attendance (16–15)";
    if (pathname.startsWith("/ingest")) return "Warehouse Data Sync & CSV Dropzone";
    return "FnB Operations";
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Desktop Left Navigation Rail */}
      <aside
        className={`no-print hidden lg:flex flex-col shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] transition-all duration-200 sticky top-0 h-screen z-30 ${
          collapsed ? "w-[72px]" : "w-[264px]"
        }`}
      >
        {/* Brand Identity Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-default)]">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-sm shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-display leading-none">
                  MAUS ATELIER
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mt-1">
                  F&B Ops & Economics
                </div>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] transition-colors cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <Suspense fallback={<div className="flex-1 p-4" />}>
          <NavigationContent collapsed={collapsed} />
        </Suspense>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] flex flex-col h-full z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-display leading-none">
                    MAUS ATELIER
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mt-1">
                    F&B Ops & Economics
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Suspense fallback={<div className="flex-1 p-4" />}>
              <NavigationContent
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </Suspense>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Command Bar */}
        <header className="no-print sticky top-0 z-20 h-16 px-4 sm:px-6 lg:px-8 bg-[var(--bg-canvas)]/85 backdrop-blur-md border-b border-[var(--border-default)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate font-display">
                {getPageLabel()}
              </span>
            </div>
          </div>

          {/* Right Controls: Theme Mode Selector & Quick Context */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-secondary)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <span>5 Concepts · 2 Outlets</span>
            </div>

            {/* Segmented Light / Dark Mode Switcher */}
            <div
              className="inline-flex items-center p-1 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] shadow-2xs"
              role="group"
              aria-label="Theme Mode Selection"
            >
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-default)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark</span>
              </button>
            </div>

            {/* Staff Terminal Lock / Logout */}
            <button
              type="button"
              onClick={handleStaffLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 border border-[var(--border-default)] text-xs font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Lock Staff Terminal / Logout"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
