import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Shield, Zap, TrendingUp, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <header className="container mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <CreditCard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">AVA Bank</span>
        </div>
        <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#security" className="hover:text-foreground transition-colors">Security</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/signup"><Button size="sm" className="bg-gradient-primary shadow-card">Open account</Button></Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 pb-20 pt-16 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" /> Modern banking, redesigned
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
              Banking that <span className="bg-gradient-primary bg-clip-text text-transparent">moves at your speed</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Send money instantly, track every transaction, and manage loans — all from a beautifully simple dashboard built for the modern world.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-primary shadow-elegant">
                  Get started free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login"><Button size="lg" variant="outline">Sign in</Button></Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {["No hidden fees", "Bank-grade security", "Instant transfers"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Card preview */}
          <div className="relative">
            <div className="bg-gradient-card rounded-3xl p-8 text-white shadow-elegant">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/60">AVA Platinum</p>
                  <p className="mt-2 text-3xl font-bold">$12,847.50</p>
                </div>
                <CreditCard className="h-8 w-8 text-white/80" />
              </div>
              <div className="mt-12 font-mono text-lg tracking-[0.3em]">•••• •••• •••• 4829</div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Holder</p>
                  <p className="text-sm font-medium">Alex Morgan</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/50">Expires</p>
                  <p className="text-sm font-medium">12/29</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">This month</p>
                  <p className="text-sm font-semibold">+$2,340 saved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Instant transfers", desc: "Send money to any account in seconds with built-in balance verification." },
            { icon: Shield, title: "Bank-grade security", desc: "Row-level encryption, role-based access, and atomic transactions." },
            { icon: TrendingUp, title: "Smart insights", desc: "Track every credit and debit with a beautiful, filterable statement view." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elegant">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 AVA Bank. All rights reserved.
      </footer>
    </div>
  );
}
