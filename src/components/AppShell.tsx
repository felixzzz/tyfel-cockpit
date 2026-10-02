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
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Scale,
  CalendarRange,
  Lock,
  ShieldCheck,
  UserCog,
  Sparkles,
  Landmark,
} from "lucide-react";
import { isFullAccessRole } from "@/lib/permissions";

const BRAND_LINKS = [
  { name: "American Breakfast Club", shortName: "ABC",         slug: "american-breakfast-club" },
  { name: "LA Breakfast Club",       shortName: "LABC",        slug: "la-breakfast-club" },
  { name: "Tyfel Coffee",            shortName: "Tyfel Coffee", slug: "tyfel-coffee" },
  { name: "People Pasta",            shortName: "People Pasta", slug: "people-pasta" },
  { name: "Herbox",                  shortName: "Herbox",       slug: "herbox" },
];

// ─── Navigation (permission-gated) ───────────────────────────────────────────

function NavigationContent({
  collapsed,
  onNavigate,
  permissions,
  role,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  permissions: string[];
  role?: string;
}) {
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const has = (p: string) => (role && isFullAccessRole(role)) || permissions.includes(p);

  const filterParams = new URLSearchParams();
  const branch = searchParams.get("branch");
  const range  = searchParams.get("range");
  const from   = searchParams.get("from");
  const to     = searchParams.get("to");
  if (branch && branch !== "all") filterParams.set("branch", branch);
  if (range  && range  !== "7d")  filterParams.set("range",  range);
  if (from) filterParams.set("from", from);
  if (to)   filterParams.set("to",   to);
  const qs = filterParams.toString() ? `?${filterParams.toString()}` : "";

  const isOverview   = pathname === "/";
  const isFinance    = pathname.startsWith("/finance");
  const isRecipes    = pathname.startsWith("/recipes");
  const isCatering   = pathname.startsWith("/catering");
  const isAttendance = pathname.startsWith("/attendance");
  const isIngest     = pathname.startsWith("/ingest");
  const isUserMgmt   = pathname.startsWith("/admin/users");

  const primaryItems = [
    {
      perm:      "overview",
      href:      `/${qs}`,
      title:     "Executive Overview",
      icon:      <LayoutDashboard className="w-4 h-4 shrink-0" />,
      label:     "Executive Overview",
      badge:     "Live",
      badgeCls:  "bg-[var(--bg-surface-2)] text-[var(--text-muted)]",
      active:    isOverview,
    },
    {
      perm:      "finance",
      href:      "/finance",
      title:     "Financial Statement, Bank Mutasi Ingestion & P&L Analysis",
      icon:      <Landmark className="w-4 h-4 shrink-0" />,
      label:     "Financial Reports",
      badge:     "P&L",
      badgeCls:  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
      active:    isFinance,
    },
    {
      perm:      "recipes",
      href:      `/recipes${qs}`,
      title:     "Recipes, BOM & Ingredient COGS Intelligence",
      icon:      <Scale className="w-4 h-4 shrink-0" />,
      label:     "Recipes & COGS",
      badge:     "BOM",
      badgeCls:  "bg-[var(--bg-surface-2)] text-[var(--text-muted)]",
      active:    isRecipes,
    },
    {
      perm:      "catering",
      href:      "/catering",
      title:     "Herbox Personal Catering CRM & Flexible Schedule Matrix",
      icon:      <CalendarRange className="w-4 h-4 shrink-0" />,
      label:     "Herbox Catering",
      badge:     "CRM",
      badgeCls:  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      active:    isCatering,
    },
    {
      perm:      "attendance",
      href:      "/attendance",
      title:     "Payroll & Attendance (16–15)",
      icon:      <Users className="w-4 h-4 shrink-0" />,
      label:     "Staff & Payslips",
      badge:     "16–15",
      badgeCls:  "bg-[var(--bg-surface-2)] text-[var(--text-muted)]",
      active:    isAttendance,
    },
    {
      perm:      "ingest",
      href:      "/ingest",
      title:     "Data Sync & CSV Ingest",
      icon:      <Database className="w-4 h-4 shrink-0" />,
      label:     "Data Sync",
      badge:     "CSV",
      badgeCls:  "bg-[var(--bg-surface-2)] text-[var(--text-muted)]",
      active:    isIngest,
    },
    {
      perm:      "user_management",
      href:      "/admin/users",
      title:     "User Management",
      icon:      <UserCog className="w-4 h-4 shrink-0" />,
      label:     "User Management",
      badge:     "Admin",
      badgeCls:  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
      active:    isUserMgmt,
    },
  ] as const;

  const visibleItems = primaryItems.filter((item) => has(item.perm));
  const hasBrands    = has("brands");

  return (
    <div className="flex flex-col flex-1 justify-between overflow-y-auto px-3 py-4 space-y-6">
      <div className="space-y-6">

        {/* Primary Workspaces */}
        <div>
          {!collapsed && (
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold">
              Operations Command
            </div>
          )}
          <nav className="space-y-1">
            {visibleItems.length === 0 && !collapsed && (
              <div className="px-3 py-5 text-[11px] text-[var(--text-muted)] font-mono text-center leading-relaxed">
                Tidak ada akses fitur.<br />Hubungi Admin.
              </div>
            )}
            {visibleItems.map((item) => (
              <Link
                key={item.perm}
                href={item.href}
                onClick={onNavigate}
                title={item.title}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  item.active
                    ? "bg-[var(--accent-primary)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)]"
                }`}
              >
                {item.icon}
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span>{item.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        item.active ? "bg-white/20 text-white" : item.badgeCls
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Culinary Concepts — gated by 'brands' permission */}
        {hasBrands && (
          <div>
            {!collapsed && (
              <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold">
                <span>Culinary Concepts</span>
                <span>5 Brands</span>
              </div>
            )}
            <nav className="space-y-1">
              {BRAND_LINKS.map((b) => {
                const bTheme       = getBrandTheme(b.slug);
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
        )}
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

// ─── AppShell ─────────────────────────────────────────────────────────────────

interface CurrentUser {
  id:          string;
  email:       string;
  name:        string;
  role:        string;
  permissions: string[];
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [collapsed,            setCollapsed]            = useState(false);
  const [mobileOpen,           setMobileOpen]           = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean | null>(null);
  const [currentUser,          setCurrentUser]          = useState<CurrentUser | null>(null);

  const isCustomerPortal = pathname.startsWith("/catering/portal");

  useEffect(() => {
    if (isCustomerPortal) return;

    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => {
        const auth = Boolean(d.authenticated);
        setIsStaffAuthenticated(auth);
        if (auth && d.user) setCurrentUser(d.user as CurrentUser);
      })
      .catch(() => setIsStaffAuthenticated(false));
  }, [pathname, isCustomerPortal]);

  async function handleLogout() {
    try { await fetch("/api/auth/login", { method: "DELETE" }); } catch {}
    setCurrentUser(null);
    setIsStaffAuthenticated(false);
  }

  // ── 1. Customer portal — standalone, no nav ──────────────────────────────
  if (isCustomerPortal) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
        {children}
      </div>
    );
  }

  // ── 2. Loading ────────────────────────────────────────────────────────────
  if (isStaffAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── 3. Login screen ───────────────────────────────────────────────────────
  if (!isStaffAuthenticated) {
    return (
      <StaffLoginScreen
        onSuccess={(user) => {
          setCurrentUser(user as CurrentUser);
          setIsStaffAuthenticated(true);
        }}
      />
    );
  }

  const userPermissions: string[] = currentUser?.permissions ?? [];

  const getPageLabel = () => {
    if (pathname === "/")                    return "Executive Portfolio Command";
    if (pathname.startsWith("/finance"))     return "Financial Reports · Statements, Mutasi & P&L Analysis";
    if (pathname.startsWith("/recipes"))     return "Culinary Economics · Recipe & Ingredient COGS Command";
    if (pathname.startsWith("/catering"))    return "Herbox · Personal Catering CRM & Flexible Schedule Engine";
    if (pathname.startsWith("/brands/")) {
      const slug = pathname.replace("/brands/", "");
      const b    = getBrandTheme(slug);
      return `Concept Telemetry · ${b.name}`;
    }
    if (pathname.startsWith("/attendance"))  return "Tyfel Coffee · Payroll & Attendance (16–15)";
    if (pathname.startsWith("/ingest"))      return "Warehouse Data Sync & CSV Dropzone";
    if (pathname.startsWith("/admin/users")) return "Admin · User Management";
    return "FnB Operations";
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`no-print hidden lg:flex flex-col shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] transition-all duration-200 sticky top-0 h-screen z-30 ${
          collapsed ? "w-[72px]" : "w-[264px]"
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--border-default)]">
          <Link href="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-sm shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-display leading-none">
                  Tyfel Hub
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
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <Suspense fallback={<div className="flex-1 p-4" />}>
          <NavigationContent
            collapsed={collapsed}
            permissions={userPermissions}
            role={currentUser?.role}
          />
        </Suspense>
      </aside>

      {/* ── Mobile Drawer ───────────────────────────────────────────────── */}
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
                    Tyfel Hub
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
                permissions={userPermissions}
                role={currentUser?.role}
              />
            </Suspense>
          </aside>
        </div>
      )}

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Command Bar */}
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

          {/* Right Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User pill */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-mono text-[var(--text-secondary)]">
                {currentUser.role === "admin" ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                )}
                <span className="max-w-[140px] truncate">{currentUser.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    currentUser.role === "admin"
                      ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                      : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            )}

            {/* Light / Dark toggle */}
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

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-2)] hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 border border-[var(--border-default)] text-xs font-mono font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Logout"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <div className="flex-1 min-w-0">{children}</div>

        {/* Global Footer */}
        <footer className="no-print mt-auto border-t border-[var(--border-default)] bg-[var(--bg-surface-1)] py-4 px-4 sm:px-6 lg:px-8 text-xs text-[var(--text-secondary)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold font-display text-[var(--text-primary)]">Tyfel Hub</span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="text-[var(--text-muted)]">FnB Operations &amp; Culinary Economics</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational Isolation Active
              </span>
              <span>Greenville &amp; Kemang Outlets</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
