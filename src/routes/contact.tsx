import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact TALA" },
      { name: "description", content: "Get in touch with the TALA team." },
      { property: "og:title", content: "Contact TALA" },
      { property: "og:description", content: "Get in touch with the TALA team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-navy">Contact us</h1>
        <p className="mt-3 text-muted-foreground">We'd love to hear from you. Reach out any time.</p>
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Mail className="h-5 w-5 text-primary" /> support@tala.ph
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <Phone className="h-5 w-5 text-primary" /> +63 2 1234 5678
          </div>
        </div>
      </div>
    </div>
  );
}
