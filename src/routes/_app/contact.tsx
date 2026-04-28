import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/contact")({ component: Contact });

function Contact() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
      <p className="mt-1 text-sm text-muted-foreground">We're here 24/7 to help</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { icon: Phone, title: "Call us", val: "1-800-NEXUS-99" },
          { icon: Mail, title: "Email", val: "support@nexus.bank" },
          { icon: MapPin, title: "Headquarters", val: "1 Wall Street, NYC" },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-6 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary"><c.icon className="h-5 w-5 text-primary-foreground" /></div>
            <h3 className="mt-3 font-semibold">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
