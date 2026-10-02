"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  UserCog,
  Plus,
  Pencil,
  ShieldCheck,
  Users,
  UserX,
  UserCheck,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Mail,
  KeyRound,
  BadgeCheck,
  LayoutDashboard,
  Scale,
  CalendarRange,
  Database,
  ChefHat,
  Lock,
  Landmark,
} from "lucide-react";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  ADMIN_DEFAULT_PERMISSIONS,
  STAFF_DEFAULT_PERMISSIONS,
  Permission,
} from "@/lib/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = "admin" | "staff";

interface User {
  id:           string;
  email:        string;
  name:         string;
  role:         UserRole;
  permissions:  Permission[];
  is_active:    boolean;
  created_at:   string;
  last_login_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PERM_ICONS: Record<Permission, React.ReactNode> = {
  overview:        <LayoutDashboard className="w-3.5 h-3.5" />,
  finance:         <Landmark        className="w-3.5 h-3.5" />,
  recipes:         <Scale          className="w-3.5 h-3.5" />,
  catering:        <CalendarRange  className="w-3.5 h-3.5" />,
  attendance:      <Users          className="w-3.5 h-3.5" />,
  ingest:          <Database       className="w-3.5 h-3.5" />,
  brands:          <ChefHat        className="w-3.5 h-3.5" />,
  user_management: <UserCog        className="w-3.5 h-3.5" />,
};

function formatDate(dt: string | null): string {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Permission Selector ──────────────────────────────────────────────────────
function PermissionSelector({
  selected,
  onChange,
}: {
  selected: Permission[];
  onChange: (perms: Permission[]) => void;
}) {
  const toggle = (p: Permission) => {
    onChange(selected.includes(p) ? selected.filter((x) => x !== p) : [...selected, p]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
          Feature Access
        </label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => onChange([...ALL_PERMISSIONS])}
            className="text-[10px] font-mono text-[var(--accent-primary)] hover:underline cursor-pointer"
          >
            Semua
          </button>
          <span className="text-[10px] text-[var(--text-muted)]">·</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline cursor-pointer"
          >
            Hapus Semua
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {ALL_PERMISSIONS.map((perm) => {
          const meta    = PERMISSION_LABELS[perm];
          const checked = selected.includes(perm);
          return (
            <button
              key={perm}
              type="button"
              onClick={() => toggle(perm)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                checked
                  ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40 text-[var(--text-primary)]"
                  : "bg-[var(--bg-surface-2)] border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                  checked
                    ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]"
                    : "border-[var(--border-strong)]"
                }`}
              >
                {checked && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {/* Icon */}
              <span className={checked ? "text-[var(--accent-primary)]" : ""}>
                {PERM_ICONS[perm]}
              </span>
              {/* Label */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight">{meta.label}</div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">{meta.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface UserModalProps {
  user:    User | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
  const isEdit = Boolean(user);

  const [name,        setName]        = useState(user?.name  ?? "");
  const [email,       setEmail]       = useState(user?.email ?? "");
  const [role,        setRole]        = useState<UserRole>(user?.role ?? "staff");
  const [permissions, setPermissions] = useState<Permission[]>(
    user?.permissions ?? [...STAFF_DEFAULT_PERMISSIONS]
  );
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // When role changes to admin, pre-fill all permissions; to staff, clear them
  function handleRoleChange(r: UserRole) {
    setRole(r);
    if (!isEdit) {
      setPermissions(r === "admin" ? [...ADMIN_DEFAULT_PERMISSIONS] : [...STAFF_DEFAULT_PERMISSIONS]);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = { name, role, permissions };
    if (!isEdit) {
      payload.email    = email;
      payload.password = password;
    } else {
      payload.id = user!.id;
      if (password) payload.password = password;
    }

    const res  = await fetch("/api/admin/users", {
      method:  isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Gagal menyimpan."); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-2xl p-6 space-y-5 my-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-[var(--text-primary)]">
            {isEdit ? "Edit User" : "Tambah User Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              Nama Lengkap
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              required placeholder="Felix Salim"
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            />
          </div>

          {/* Email — new users only */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="user@tyfelhub.id"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>
          )}

          {/* Role */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              Role
            </label>
            <div className="inline-flex w-full rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface-2)]">
              {(["admin", "staff"] as UserRole[]).map((r) => (
                <button
                  key={r} type="button" onClick={() => handleRoleChange(r)}
                  className={`flex-1 py-2.5 text-xs font-semibold font-mono uppercase tracking-wider transition-all ${
                    role === r
                      ? r === "admin" ? "bg-violet-600 text-white" : "bg-[var(--accent-primary)] text-white"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {r === "admin" ? "Admin" : "Staff"}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <PermissionSelector selected={permissions} onChange={setPermissions} />

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              {isEdit ? "Password Baru (opsional)" : "Password"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isEdit} minLength={6}
                placeholder={isEdit ? "Biarkan kosong jika tidak diubah" : "Minimal 6 karakter"}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]" tabIndex={-1}>
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
              Batal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-all">
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                : <><BadgeCheck className="w-4 h-4" /> {isEdit ? "Simpan Perubahan" : "Buat User"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Permission Badges (inline in table) ──────────────────────────────────────
function PermissionBadges({ permissions }: { permissions: Permission[] }) {
  if (permissions.length === 0)
    return <span className="text-[10px] font-mono text-[var(--text-muted)]">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((p) => (
        <span
          key={p}
          title={PERMISSION_LABELS[p].label}
          className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
        >
          {PERM_ICONS[p]}
          {PERMISSION_LABELS[p].label.split(" ")[0]}
        </span>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserManagementPage() {
  const [users,     setUsers]     = useState<User[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<User | null | "new">(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 403
          ? "Akses ditolak. Hanya pengguna dengan akses User Management yang bisa membuka halaman ini."
          : (data.error ?? "Gagal memuat users."));
      } else {
        setUsers(data.users ?? []);
      }
    } catch {
      setError("Koneksi gagal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActive(user: User) {
    setActioning(user.id);
    const method  = user.is_active ? "DELETE" : "PUT";
    const body    = user.is_active ? { id: user.id } : { id: user.id, is_active: true };
    const res     = await fetch("/api/admin/users", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    setActioning(null);
    if (!res.ok) { alert(data.error ?? "Gagal."); return; }
    fetchUsers();
  }

  const activeCount = users.filter((u) =>  u.is_active).length;
  const adminCount  = users.filter((u) =>  u.role === "admin" && u.is_active).length;

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-violet-500/15 text-violet-600 dark:text-violet-400 font-semibold">
                Admin
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1 font-display">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              Kelola akun staff, role, dan akses fitur secara granular.
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalUser("new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length,  icon: Users,       color: "text-sky-500"    },
          { label: "Active",      value: activeCount,   icon: UserCheck,   color: "text-emerald-500" },
          { label: "Admins",      value: adminCount,    icon: ShieldCheck, color: "text-violet-500"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="cockpit-panel rounded-2xl p-4 flex items-center gap-3">
            <div className={`${color} shrink-0`}><Icon className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-bold font-display text-[var(--text-primary)]">{value}</div>
              <div className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3 text-sm text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-mono">Memuat data user...</span>
        </div>
      ) : (
        <div className="cockpit-panel rounded-2xl overflow-hidden border border-[var(--border-default)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-2)]">
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">User</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] hidden lg:table-cell">Feature Access</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] hidden md:table-cell">Last Login</th>
                <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-muted)] font-mono">
                    Belum ada user terdaftar.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors ${user.is_active ? "hover:bg-[var(--bg-surface-2)]" : "opacity-50"}`}
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] flex items-center justify-center text-xs font-bold shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] text-xs truncate">{user.name}</div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Role */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-lg ${
                      user.role === "admin"
                        ? "bg-violet-500/15 text-violet-600 dark:text-violet-400"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)] border border-[var(--border-subtle)]"
                    }`}>
                      {user.role === "admin" && <ShieldCheck className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  {/* Feature Access */}
                  <td className="px-4 py-3 hidden lg:table-cell max-w-[260px]">
                    <PermissionBadges permissions={user.permissions} />
                  </td>
                  {/* Last Login */}
                  <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)] hidden md:table-cell whitespace-nowrap">
                    {formatDate(user.last_login_at)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[10px] font-mono font-semibold px-2 py-1 rounded-lg ${
                      user.is_active
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-muted)]"
                    }`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModalUser(user)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-3)] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        disabled={actioning === user.id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.is_active
                            ? "text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10"
                            : "text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10"
                        }`}
                        title={user.is_active ? "Nonaktifkan" : "Aktifkan kembali"}
                      >
                        {actioning === user.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Security note */}
      <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-xs text-[var(--text-muted)]">
        <Lock className="w-4 h-4 shrink-0 text-violet-500 mt-0.5" />
        <span>
          Password disimpan terenkripsi (bcrypt). Session menggunakan JWT HttpOnly cookie (30 hari).
          Akses fitur dikontrol granular per-user. Minimal satu Admin harus aktif.
        </span>
      </div>

      {/* Modal */}
      {modalUser !== null && (
        <UserModal
          user={modalUser === "new" ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSaved={fetchUsers}
        />
      )}
    </main>
  );
}
