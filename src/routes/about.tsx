import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About TALA — Empowering Filipino Teachers" },
      { name: "description", content: "Learn how TALA supports Filipino teachers with AI-powered planning and assessment tools." },
      { property: "og:title", content: "About TALA" },
      { property: "og:description", content: "How TALA helps Filipino teachers." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-navy">About TALA</h1>
        <p className="mt-4 text-muted-foreground">
          TALA — Teaching Automation for Lesson Planning and Assessment — is built for Filipino public school teachers.
          We combine intelligent automation with DepEd-aligned templates to save teachers time and improve consistency.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card title="Our Mission" body="Empower Filipino teachers by automating repetitive tasks so they can focus on inspiring students." />
          <Card title="Our Vision" body="A future where every teacher has intelligent tools that make lesson planning and assessment effortless." />
        </div>
      </div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h3>
      <p className="mt-2">{body}</p>
    </div>
  );
}
