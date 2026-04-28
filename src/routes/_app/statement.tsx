import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Loader2, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/statement")({ component: Statement });

interface Txn {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balance_after: number;
  description: string;
  counterparty: string | null;
  created_at: string;
}

function Statement() {
  const { user } = useAuth();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: acc } = await supabase.from("accounts").select("id").eq("user_id", user.id).maybeSingle();
      if (!acc) { setLoading(false); return; }
      const { data } = await supabase.from("transactions").select("*").eq("account_id", acc.id).order("created_at", { ascending: false });
      setTxns((data as Txn[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = txns.filter((t) => {
    const d = new Date(t.created_at);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + "T23:59:59")) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Statement</h1>
          <p className="mt-1 text-sm text-muted-foreground">All transactions on your account</p>
        </div>
        <div className="flex gap-3">
          <div>
            <Label htmlFor="from" className="text-xs">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="to" className="text-xs">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No transactions to display</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()} <span className="text-xs">{new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.description || "Transaction"}</div>
                    {t.counterparty && <div className="text-xs text-muted-foreground">{t.type === "credit" ? "From" : "To"}: {t.counterparty}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.type === "credit" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {t.type === "credit" ? "Credit" : "Debit"}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.type === "credit" ? "text-success" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "-"}${Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">${Number(t.balance_after).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
