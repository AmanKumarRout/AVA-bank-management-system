import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Wallet, Landmark, ArrowLeftRight, Building2, LogOut, Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: Admin,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
});

interface Stats { customers: number; accounts: number; loans: number; txns: number; totalBalance: number; }
interface UserRow { id: string; full_name: string; email: string; status: string; balance: number; account_number: string; }
interface TxnRow { id: string; type: string; amount: number; description: string; created_at: string; account_number: string; }
interface LoanRow { id: string; amount: number; purpose: string; status: string; full_name: string; created_at: string; }

function Admin() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ customers: 0, accounts: 0, loans: 0, txns: 0, totalBalance: 0 });
  const [users, setUsers] = useState<UserRow[]>([]);
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (role && role !== "admin") { navigate({ to: "/dashboard" }); return; }
    if (role !== "admin") return;
    load();
    // eslint-disable-next-line
  }, [authLoading, user, role]);

  const load = async () => {
    setLoading(true);
    const [profilesRes, accountsRes, loansRes, txnsRes] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email,status"),
      supabase.from("accounts").select("user_id,account_number,balance"),
      supabase.from("loans").select("id,user_id,amount,purpose,status,created_at").order("created_at", { ascending: false }),
      supabase.from("transactions").select("id,account_id,type,amount,description,created_at").order("created_at", { ascending: false }).limit(50),
    ]);

    const profiles = profilesRes.data ?? [];
    const accounts = accountsRes.data ?? [];
    const loansData = loansRes.data ?? [];
    const txnsData = txnsRes.data ?? [];

    const totalBalance = accounts.reduce((s, a: any) => s + Number(a.balance), 0);
    setStats({
      customers: profiles.length,
      accounts: accounts.length,
      loans: loansData.length,
      txns: txnsData.length,
      totalBalance,
    });

    const accByUser = new Map(accounts.map((a: any) => [a.user_id, a]));
    const accById = new Map(accounts.map((a: any) => [a.user_id, a.account_number]));
    setUsers(profiles.map((p: any) => ({
      id: p.id, full_name: p.full_name, email: p.email, status: p.status,
      balance: Number((accByUser.get(p.id) as any)?.balance ?? 0),
      account_number: (accByUser.get(p.id) as any)?.account_number ?? "—",
    })));

    const profById = new Map(profiles.map((p: any) => [p.id, p.full_name]));
    setLoans(loansData.map((l: any) => ({ ...l, full_name: profById.get(l.user_id) ?? "Unknown" })));

    // Fetch full account details for txn mapping
    const allAccounts = await supabase.from("accounts").select("id,account_number");
    const accNumById = new Map((allAccounts.data ?? []).map((a: any) => [a.id, a.account_number]));
    setTxns(txnsData.map((t: any) => ({ ...t, account_number: accNumById.get(t.account_id) ?? "—" })));

    setLoading(false);
  };

  const toggleBlock = async (u: UserRow) => {
    const newStatus = u.status === "active" ? "blocked" : "active";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(`User ${newStatus}`);
    load();
  };

  const handleSignOut = async () => { await signOut(); navigate({ to: "/" }); };

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">AVA Bank — Admin</h1>
              <p className="text-xs text-muted-foreground">System Console</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: Users, label: "Total Customers", value: stats.customers },
            { icon: Wallet, label: "Total Accounts", value: stats.accounts },
            { icon: Landmark, label: "Total Loans", value: stats.loans },
            { icon: ArrowLeftRight, label: "Transactions", value: stats.txns },
            { icon: Building2, label: "System Balance", value: `₹${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary"><s.icon className="h-5 w-5 text-primary-foreground" /></div>
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Users */}
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="border-b border-border p-5"><h2 className="font-semibold">All customers</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{u.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.account_number}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{u.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => toggleBlock(u)}>
                        {u.status === "active" ? <><Ban className="h-3 w-3 mr-1" />Block</> : <><CheckCircle2 className="h-3 w-3 mr-1" />Unblock</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent transactions */}
          <div className="rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-5"><h2 className="font-semibold">Recent transactions</h2></div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {txns.slice(0, 20).map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5">
                        <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div>
                        <div className="font-mono text-xs">{t.account_number}</div>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${t.type === "credit" ? "text-success" : "text-destructive"}`}>
                        {t.type === "credit" ? "+" : "-"}₹{Number(t.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {txns.length === 0 && <tr><td className="p-6 text-center text-sm text-muted-foreground">No transactions</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Loans */}
          <div className="rounded-2xl border border-border bg-card shadow-card">
            <div className="border-b border-border p-5"><h2 className="font-semibold">Loan applications</h2></div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.full_name}</div>
                        <div className="text-xs text-muted-foreground">{l.purpose}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">₹{Number(l.amount).toLocaleString()}</div>
                        <span className={`text-xs ${l.status === "approved" ? "text-success" : l.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}>{l.status}</span>
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && <tr><td className="p-6 text-center text-sm text-muted-foreground">No loan applications</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
