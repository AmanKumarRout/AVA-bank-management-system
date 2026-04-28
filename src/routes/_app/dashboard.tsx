import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Send, Eye, History, Landmark, User, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

interface Account {
  id: string;
  account_number: string;
  balance: number;
  card_number: string;
  card_expiry: string;
}
interface Profile { full_name: string; email: string; }
interface Txn { id: string; type: "credit" | "debit"; amount: number; description: string; created_at: string; }

function Dashboard() {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: acc }, { data: prof }] = await Promise.all([
        supabase.from("accounts").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle(),
      ]);
      setAccount(acc as Account);
      setProfile(prof as Profile);
      if (acc) {
        const { data: t } = await supabase
          .from("transactions").select("*").eq("account_id", acc.id)
          .order("created_at", { ascending: false }).limit(5);
        setTxns((t as Txn[]) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const fmtCard = (n?: string) => n ? `${n.slice(0,4)} ${n.slice(4,8)} ${n.slice(8,12)} ${n.slice(12,16)}` : "";
  const credits = txns.filter(t => t.type === "credit").reduce((s, t) => s + Number(t.amount), 0);
  const debits = txns.filter(t => t.type === "debit").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="text-3xl font-bold tracking-tight">{profile?.full_name || "User"}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance + Card */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Available Balance</p>
            <p className="mt-2 text-4xl font-bold">${Number(account?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-xs text-muted-foreground">Acct • {account?.account_number}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-success/10 p-3">
                <div className="flex items-center gap-1.5 text-xs text-success"><TrendingUp className="h-3 w-3" /> Credits</div>
                <p className="mt-1 text-lg font-semibold">${credits.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 p-3">
                <div className="flex items-center gap-1.5 text-xs text-destructive"><TrendingDown className="h-3 w-3" /> Debits</div>
                <p className="mt-1 text-lg font-semibold">${debits.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Debit card */}
          <div className="bg-gradient-card relative overflow-hidden rounded-2xl p-6 text-white shadow-elegant">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-widest text-white/60">Debit Card</p>
              <CreditCard className="h-6 w-6 text-white/80" />
            </div>
            <p className="mt-10 font-mono text-lg tracking-[0.25em]">{fmtCard(account?.card_number)}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50">Holder</p>
                <p className="text-sm font-medium">{profile?.full_name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50">Expires</p>
                <p className="text-sm font-medium">{account?.card_expiry}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-semibold">Quick actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link to="/transfer"><Button variant="outline" className="h-auto w-full flex-col gap-1.5 py-4"><Send className="h-4 w-4" /><span className="text-xs">Send Money</span></Button></Link>
            <Link to="/statement"><Button variant="outline" className="h-auto w-full flex-col gap-1.5 py-4"><Eye className="h-4 w-4" /><span className="text-xs">View Expenses</span></Button></Link>
            <Link to="/statement"><Button variant="outline" className="h-auto w-full flex-col gap-1.5 py-4"><History className="h-4 w-4" /><span className="text-xs">History</span></Button></Link>
            <Link to="/services"><Button variant="outline" className="h-auto w-full flex-col gap-1.5 py-4"><Landmark className="h-4 w-4" /><span className="text-xs">Loans</span></Button></Link>
            <Link to="/services" className="col-span-2"><Button variant="outline" className="w-full"><User className="h-4 w-4 mr-2" />Account Details</Button></Link>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent activity</h3>
          <Link to="/statement" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <div className="mt-4 divide-y divide-border">
          {txns.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet</p>}
          {txns.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {t.type === "credit" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.description || (t.type === "credit" ? "Received" : "Sent")}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className={`font-semibold ${t.type === "credit" ? "text-success" : "text-destructive"}`}>
                {t.type === "credit" ? "+" : "-"}${Number(t.amount).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
