import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/transfer")({ component: Transfer });

function Transfer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [senderAcc, setSenderAcc] = useState("");
  const [balance, setBalance] = useState(0);
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("account_number,balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setSenderAcc(data.account_number); setBalance(Number(data.balance)); } });
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setLoading(true);
    const { data, error } = await supabase.rpc("transfer_money", {
      _to_account_number: toAccount.trim(),
      _amount: amt,
      _description: description || "Transfer",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    const result = data as { success: boolean; message: string };
    if (result.success) {
      toast.success(result.message);
      setTimeout(() => navigate({ to: "/dashboard" }), 800);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Transfer Money</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send funds securely to any Nexus account</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 rounded-xl bg-gradient-primary p-4 text-primary-foreground shadow-glow">
          <p className="text-xs uppercase tracking-widest opacity-80">Available Balance</p>
          <p className="mt-1 text-2xl font-bold">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Sender Account</Label>
            <Input value={senderAcc} disabled className="mt-1.5 bg-muted font-mono" />
          </div>
          <div>
            <Label htmlFor="to">Receiver Account Number</Label>
            <Input id="to" required value={toAccount} onChange={(e) => setToAccount(e.target.value)} placeholder="AC0000000000" className="mt-1.5 font-mono" />
          </div>
          <div>
            <Label htmlFor="amt">Amount (USD)</Label>
            <Input id="amt" type="number" step="0.01" min="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="desc">Description (optional)</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's it for?" className="mt-1.5" />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-card">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Send Money</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
