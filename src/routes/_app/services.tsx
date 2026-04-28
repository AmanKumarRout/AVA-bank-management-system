import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Shield, Smartphone, PiggyBank, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/services")({ component: Services });

interface Loan { id: string; amount: number; purpose: string; status: string; created_at: string; }

function Services() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("loans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setLoans((data as Loan[]) ?? []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("loans").insert({ user_id: user.id, amount: parseFloat(amount), purpose });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Loan application submitted");
    setAmount(""); setPurpose("");
    load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">Loans, savings, and more</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Landmark, title: "Personal Loans", desc: "From 6.9% APR" },
          { icon: PiggyBank, title: "Savings Plans", desc: "4.2% high-yield" },
          { icon: Shield, title: "Insurance", desc: "Life & assets" },
          { icon: Smartphone, title: "Mobile Banking", desc: "iOS & Android" },
        ].map((s) => (
          <div key={s.title} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary"><s.icon className="h-5 w-5 text-primary-foreground" /></div>
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Apply for a loan</h2>
          <form onSubmit={apply} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="lamt">Amount (INR)</Label>
              <Input id="lamt" type="number" step="0.01" min="100" required value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="purp">Purpose</Label>
              <Input id="purp" required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Home renovation" className="mt-1" />
            </div>
            <Button disabled={loading} className="w-full bg-gradient-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit application"}
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Your loan applications</h2>
          {loans.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No applications yet</p>}
          <div className="mt-4 space-y-3">
            {loans.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-semibold">₹{Number(l.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{l.purpose}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  l.status === "approved" ? "bg-success/10 text-success" :
                  l.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-accent text-accent-foreground"
                }`}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
