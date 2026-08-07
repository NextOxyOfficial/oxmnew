"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  KeyRound,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { ApiService } from "@/lib/api";
import { useToast, useConfirm } from "@/components/ui/Feedback";

/**
 * Role settings — who may sign in, and what each of them may do.
 *
 * The permission catalogue is fetched rather than hard-coded here: the server
 * is the only place that can be authoritative, since it is also the thing that
 * enforces them. A checkbox this screen invented on its own would tick nothing.
 */

interface PermissionItem {
  code: string;
  label: string;
}
interface PermissionGroup {
  group: string;
  items: PermissionItem[];
}
interface AccessRow {
  employee: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  username: string;
  is_enabled: boolean;
  permissions: string[];
  last_login_at: string | null;
}
interface EmployeeRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

const MIN_PASSWORD = 6;

interface Props {
  /**
   * Narrow the screen to one employee.
   *
   * The employee profile shows the same component rather than a second copy of
   * the permission logic — the catalogue, the checkbox sheet and the save calls
   * all have to stay in step with the server, and two implementations would
   * drift.
   */
  employeeId?: number;
}

export default function RoleSettingsTab({ employeeId }: Props = {}) {
  const single = employeeId != null;
  const toast = useToast();
  const confirm = useConfirm();

  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [preset, setPreset] = useState<string[]>([]);
  const [access, setAccess] = useState<AccessRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Which employee's permission sheet is open. */
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cat, rows, emps] = await Promise.all([
        ApiService.getPermissionCatalogue(),
        ApiService.getEmployeeAccess(),
        ApiService.getEmployees(),
      ]);
      setGroups(cat.groups ?? []);
      setPreset(cat.default_preset ?? []);
      setAccess(Array.isArray(rows) ? rows : []);
      const list = Array.isArray(emps) ? emps : emps?.results ?? [];
      setEmployees(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "তথ্য আনা যায়নি");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accessByEmployee = useMemo(() => {
    const map = new Map<number, AccessRow>();
    access.forEach((row) => map.set(row.employee, row));
    return map;
  }, [access]);

  const allCodes = useMemo(
    () => groups.flatMap((g) => g.items.map((i) => i.code)),
    [groups]
  );

  const visible = useMemo(() => {
    if (single) return employees.filter((e) => e.id === employeeId);
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.email, e.phone, e.role]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, search, single, employeeId]);

  const openSheet = (employeeId: number) => {
    const existing = accessByEmployee.get(employeeId);
    setEditing(employeeId);
    // A brand-new login starts from the preset so the owner is not staring at
    // thirty-six empty boxes.
    setDraft(existing ? [...existing.permissions] : [...preset]);
    setPassword("");
  };

  const toggle = (code: string) =>
    setDraft((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const toggleGroup = (group: PermissionGroup) => {
    const codes = group.items.map((i) => i.code);
    const allOn = codes.every((c) => draft.includes(c));
    setDraft((prev) =>
      allOn
        ? prev.filter((c) => !codes.includes(c))
        : Array.from(new Set([...prev, ...codes]))
    );
  };

  const save = async (employeeId: number) => {
    const existing = accessByEmployee.get(employeeId);
    if (!existing && password.length < MIN_PASSWORD) {
      toast.error(`পাসওয়ার্ড অন্তত ${MIN_PASSWORD} অক্ষরের দিন`);
      return;
    }
    if (existing && password && password.length < MIN_PASSWORD) {
      toast.error(`পাসওয়ার্ড অন্তত ${MIN_PASSWORD} অক্ষরের দিন`);
      return;
    }

    setSaving(true);
    try {
      if (existing) {
        await ApiService.updateEmployeeAccess(employeeId, {
          permissions: draft,
          ...(password ? { password } : {}),
        });
        toast.success("অনুমতি সেভ হয়েছে");
      } else {
        await ApiService.createEmployeeAccess(employeeId, {
          password,
          permissions: draft,
        });
        toast.success("লগইন বানানো হয়েছে");
      }
      setEditing(null);
      setPassword("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "সেভ করা গেল না");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (row: AccessRow) => {
    try {
      await ApiService.updateEmployeeAccess(row.employee, {
        is_enabled: !row.is_enabled,
      });
      toast.success(row.is_enabled ? "লগইন বন্ধ হয়েছে" : "লগইন চালু হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "বদলানো গেল না");
    }
  };

  const revoke = async (row: AccessRow) => {
    const ok = await confirm({
      title: "লগইন বাতিল করবেন?",
      message: `${row.name} আর ঢুকতে পারবে না। কর্মচারীর রেকর্ড থেকে যাবে।`,
      confirmLabel: "বাতিল করুন",
      danger: true,
    });
    if (!ok) return;
    try {
      await ApiService.deleteEmployeeAccess(row.employee);
      toast.success("লগইন বাতিল হয়েছে");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "বাতিল করা গেল না");
    }
  };

  if (loading) {
    return (
      <div className="plane">
        <div className="plane-section">
          <div className="empty">লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="plane">
        <div className="plane-section">
          <div className="empty">
            <p>{error}</p>
            <button onClick={load} className="btn btn-ghost btn-sm mt-2">
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  const withLogin = access.length;

  return (
    <div className="plane">
      {!single && (
      <div className="stat-strip">
        <div className="stat">
          <div className="stat-label">মোট কর্মচারী</div>
          <div className="stat-value num">
            {employees.length.toLocaleString("bn-BD")}
          </div>
          <div className="stat-meta">সব মিলিয়ে</div>
        </div>
        <div className="stat">
          <div className="stat-label">লগইন দেওয়া আছে</div>
          <div className="stat-value num money-pos">
            {withLogin.toLocaleString("bn-BD")}
          </div>
          <div className="stat-meta">নিজের আইডি দিয়ে ঢুকতে পারে</div>
        </div>
        <div className="stat">
          <div className="stat-label">এখন বন্ধ</div>
          <div className="stat-value num money-neg">
            {access
              .filter((a) => !a.is_enabled)
              .length.toLocaleString("bn-BD")}
          </div>
          <div className="stat-meta">লগইন আছে কিন্তু বন্ধ করা</div>
        </div>
        <div className="stat">
          <div className="stat-label">মোট অনুমতি</div>
          <div className="stat-value num">
            {allCodes.length.toLocaleString("bn-BD")}
          </div>
          <div className="stat-meta">{groups.length} টা ভাগে</div>
        </div>
      </div>
      )}

      <div className="plane-section">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="section-title mb-0">কে কে ঢুকতে পারবে</div>
            <p className="mt-1 text-xs text-slate-500">
              পাসওয়ার্ড আপনি দেবেন। কর্মচারী তার নিজের ফোন নম্বর বা ইমেইল দিয়ে
              ঢুকবে।
            </p>
          </div>
          {!single && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="নাম, ফোন বা পদ দিয়ে খুঁজুন"
                className="input input-sm w-56 pl-8"
              />
            </div>
          )}
        </div>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>কর্মচারী</th>
              <th>যা দিয়ে ঢুকবে</th>
              <th>অবস্থা</th>
              <th className="cell-num">কয়টা অনুমতি</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty">কোনো কর্মচারী পাওয়া যায়নি।</div>
                </td>
              </tr>
            )}
            {visible.map((employee) => {
              const row = accessByEmployee.get(employee.id);
              return (
                <tr key={employee.id}>
                  <td>
                    <span className="block cell-strong">{employee.name}</span>
                    <span className="block text-xs text-slate-500">
                      {employee.role || "পদ নেই"}
                    </span>
                  </td>
                  <td className="text-xs text-slate-600">
                    {employee.phone || employee.email || (
                      <span className="text-amber-600">
                        ফোন বা ইমেইল নেই — আগে যোগ করুন
                      </span>
                    )}
                  </td>
                  <td>
                    {!row ? (
                      <span className="badge badge-muted">লগইন নেই</span>
                    ) : row.is_enabled ? (
                      <span className="badge badge-success">চালু</span>
                    ) : (
                      <span className="badge badge-danger">বন্ধ</span>
                    )}
                  </td>
                  <td className="cell-num num">
                    {row ? `${row.permissions.length}/${allCodes.length}` : "—"}
                  </td>
                  <td className="cell-num">
                    <div className="row-actions">
                      <button
                        type="button"
                        onClick={() => openSheet(employee.id)}
                        disabled={!employee.phone && !employee.email}
                        title={row ? "অনুমতি বদলান" : "লগইন দিন"}
                        aria-label={row ? "অনুমতি বদলান" : "লগইন দিন"}
                        className="text-slate-500 hover:text-cyan-600 disabled:opacity-40"
                      >
                        {row ? (
                          <UserCog className="h-4 w-4" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}
                      </button>
                      {row && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleEnabled(row)}
                            title={row.is_enabled ? "বন্ধ করুন" : "চালু করুন"}
                            aria-label={row.is_enabled ? "বন্ধ করুন" : "চালু করুন"}
                            className={
                              row.is_enabled
                                ? "text-emerald-600 hover:text-amber-600"
                                : "text-slate-400 hover:text-emerald-600"
                            }
                          >
                            {row.is_enabled ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => revoke(row)}
                            title="লগইন বাতিল করুন"
                            aria-label="লগইন বাতিল করুন"
                            className="text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal max-w-3xl">
            <div className="modal-head">
              <h2 className="modal-title">
                {accessByEmployee.has(editing)
                  ? "অনুমতি বদলান"
                  : "লগইন দিন"}{" "}
                — {employees.find((e) => e.id === editing)?.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="বন্ধ করুন"
                className="btn btn-ghost btn-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <label className="label" htmlFor="staff-password">
                  {accessByEmployee.has(editing)
                    ? "নতুন পাসওয়ার্ড (বদলাতে না চাইলে খালি রাখুন)"
                    : "পাসওয়ার্ড *"}
                </label>
                <input
                  id="staff-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="অন্তত ৬ অক্ষর"
                  className="input"
                  autoComplete="new-password"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  এই পাসওয়ার্ডটা কর্মচারীকে বলে দিন। সে ঢুকবে{" "}
                  <span className="font-medium text-slate-700">
                    {employees.find((e) => e.id === editing)?.phone ||
                      employees.find((e) => e.id === editing)?.email}
                  </span>{" "}
                  আর এই পাসওয়ার্ড দিয়ে।
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="section-title mb-0">
                  কী কী করতে পারবে ({draft.length}/{allCodes.length})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft([...preset])}
                    className="btn btn-ghost btn-sm"
                  >
                    সাধারণ সেলসম্যান
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft([...allCodes])}
                    className="btn btn-ghost btn-sm"
                  >
                    সব দিন
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft([])}
                    className="btn btn-ghost btn-sm"
                  >
                    সব তুলে নিন
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groups.map((group) => {
                  const codes = group.items.map((i) => i.code);
                  const on = codes.filter((c) => draft.includes(c)).length;
                  return (
                    <div
                      key={group.group}
                      className="rounded-lg border border-slate-200"
                    >
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="flex w-full items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <span className="text-sm font-semibold text-slate-800">
                          {group.group}
                        </span>
                        <span
                          className={`num text-xs ${
                            on === codes.length
                              ? "money-pos"
                              : on > 0
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          {on}/{codes.length}
                        </span>
                      </button>
                      <div className="space-y-1 px-3 py-2">
                        {group.items.map((item) => {
                          const checked = draft.includes(item.code);
                          return (
                            <label
                              key={item.code}
                              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-slate-50"
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                  checked
                                    ? "border-cyan-600 bg-cyan-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(item.code)}
                                className="sr-only"
                              />
                              <span className="text-slate-700">{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="btn btn-ghost"
                disabled={saving}
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => save(editing)}
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
