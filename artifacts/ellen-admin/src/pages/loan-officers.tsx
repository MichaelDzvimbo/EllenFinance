import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users, Plus, Edit, Trash2, KeyRound, Power, PowerOff, RefreshCw,
  CheckCircle, XCircle, Shield, BarChart2, Loader2, X, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("admin_token") ?? sessionStorage.getItem("admin_token") ?? "";
}

async function apiFetch(path: string) {
  const res = await fetch(`${BASE}/api/admin${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
  return res.json();
}

async function apiMutate(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}/api/admin${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed");
  return data;
}

interface Officer {
  id: number;
  username: string;
  fullName: string;
  email: string;
  isActive: boolean;
  permissions: string[];
  assignedApplications: number;
  activityCount: number;
  createdBy: string;
  createdAt: string;
  lastLoginAt: string | null;
}

const ALL_PERMISSIONS = [
  { key: "view_applications", label: "View Applications" },
  { key: "update_applications", label: "Update Applications" },
  { key: "approve_applications", label: "Approve/Reject" },
  { key: "view_documents", label: "View Documents" },
  { key: "view_loans", label: "View Loans" },
  { key: "send_notifications", label: "Send Notifications" },
];

const DEFAULT_FORM = { username: "", fullName: "", email: "", password: "", permissions: [] as string[] };

export default function LoanOfficers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [resetTarget, setResetTarget] = useState<Officer | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-loan-officers"],
    queryFn: () => apiFetch("/loan-officers"),
    refetchInterval: 15000,
  });

  const createMut = useMutation({
    mutationFn: (body: typeof DEFAULT_FORM) => apiMutate("POST", "/loan-officers", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-loan-officers"] }); setShowForm(false); setForm(DEFAULT_FORM); toast({ title: "Loan officer created" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<Officer> }) => apiMutate("PATCH", `/loan-officers/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-loan-officers"] }); setEditingOfficer(null); toast({ title: "Officer updated" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiMutate("DELETE", `/loan-officers/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-loan-officers"] }); setDeleteConfirm(null); toast({ title: "Officer deleted" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetPassMut = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => apiMutate("POST", `/loan-officers/${id}/reset-password`, { newPassword: password }),
    onSuccess: () => { setResetTarget(null); setNewPassword(""); toast({ title: "Password reset successfully" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const distributeMut = useMutation({
    mutationFn: () => apiMutate("POST", "/loan-officers/auto-distribute"),
    onSuccess: (d: { distributed: number; officers: number }) => { qc.invalidateQueries({ queryKey: ["admin-loan-officers"] }); toast({ title: `Distributed ${d.distributed} applications across ${d.officers} officers` }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const officers: Officer[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const MAX = 20;

  function togglePerm(perm: string, perms: string[]): string[] {
    return perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Loan Officers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total}/{MAX} accounts — only Admin can create, edit or delete officers
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => distributeMut.mutate()} disabled={distributeMut.isPending}>
            {distributeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Auto-Distribute Apps
          </Button>
          <Button size="sm" onClick={() => { setShowForm(true); setForm(DEFAULT_FORM); }} disabled={total >= MAX}>
            <Plus className="h-4 w-4 mr-2" />
            Add Officer {total >= MAX && `(limit reached)`}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Officers", value: total, icon: Users },
          { label: "Active", value: officers.filter(o => o.isActive).length, icon: CheckCircle },
          { label: "Inactive", value: officers.filter(o => !o.isActive).length, icon: PowerOff },
          { label: "Remaining Slots", value: MAX - total, icon: Shield },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold">Create Loan Officer Account</h2>
            <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs text-muted-foreground mb-1 block">Username *</label><Input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase() }))} placeholder="e.g. john_doe" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Full Name *</label><Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="John Doe" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Email *</label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@ellenfinance.co.zw" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Password *</label>
              <div className="relative">
                <Input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map(p => (
                <button key={p.key} onClick={() => setForm(f => ({ ...f, permissions: togglePerm(p.key, f.permissions) }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.permissions.includes(p.key) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending || !form.username || !form.fullName || !form.email || !form.password}>
            {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Officer
          </Button>
        </div>
      )}

      {/* Officers List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : officers.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-serif text-lg font-bold mb-2">No Loan Officers Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first loan officer to start distributing applications.</p>
          <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Create First Officer</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr>
                {["Officer", "Status", "Permissions", "Assigned Apps", "Activity", "Last Login", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {officers.map(o => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase">
                        {o.fullName.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium">{o.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{o.username}</p>
                        <p className="text-xs text-muted-foreground">{o.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={o.isActive ? "default" : "secondary"} className={o.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}>
                      {o.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {o.permissions.length === 0 ? <span className="text-xs text-muted-foreground">None</span> :
                        o.permissions.map(p => <span key={p} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{ALL_PERMISSIONS.find(x => x.key === p)?.label ?? p}</span>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-bold">{o.assignedApplications}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.activityCount} actions</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {o.lastLoginAt ? new Date(o.lastLoginAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Edit" onClick={() => setEditingOfficer(o)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"><Edit className="h-3.5 w-3.5" /></button>
                      <button title={o.isActive ? "Deactivate" : "Activate"} onClick={() => updateMut.mutate({ id: o.id, body: { isActive: !o.isActive } as Partial<Officer> })} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                        {o.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5 text-emerald-500" />}
                      </button>
                      <button title="Reset Password" onClick={() => setResetTarget(o)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"><KeyRound className="h-3.5 w-3.5" /></button>
                      <button title="Delete" onClick={() => setDeleteConfirm(o.id)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold">Edit Officer: @{editingOfficer.username}</h2>
              <button onClick={() => setEditingOfficer(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <Input defaultValue={editingOfficer.fullName} onChange={e => setEditingOfficer(p => p ? { ...p, fullName: e.target.value } : p)} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Email</label>
                <Input type="email" defaultValue={editingOfficer.email} onChange={e => setEditingOfficer(p => p ? { ...p, email: e.target.value } : p)} /></div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_PERMISSIONS.map(p => (
                    <button key={p.key} onClick={() => setEditingOfficer(o => o ? { ...o, permissions: togglePerm(p.key, o.permissions) } : o)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${editingOfficer.permissions.includes(p.key) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => updateMut.mutate({ id: editingOfficer.id, body: { fullName: editingOfficer.fullName, email: editingOfficer.email, permissions: editingOfficer.permissions } as Partial<Officer> })} disabled={updateMut.isPending} className="flex-1">
                  {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingOfficer(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold">Reset Password</h2>
              <button onClick={() => { setResetTarget(null); setNewPassword(""); }}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Set a new password for <strong>@{resetTarget.username}</strong></p>
            <div className="relative mb-4">
              <Input type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => resetPassMut.mutate({ id: resetTarget.id, password: newPassword })} disabled={resetPassMut.isPending || newPassword.length < 6} className="flex-1">
                {resetPassMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />} Reset Password
              </Button>
              <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword(""); }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-serif text-lg font-bold mb-2">Delete Officer?</h2>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. All assignments will be removed.</p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={() => deleteMut.mutate(deleteConfirm)} disabled={deleteMut.isPending} className="flex-1">
                {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Delete
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
