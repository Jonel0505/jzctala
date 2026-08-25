import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteContent } from "@/lib/public.functions";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { TalaFooter } from "@/components/tala/TalaFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TALA — Teaching Automation for Filipino Teachers" },
      { name: "description", content: "AI-powered lesson plans, TOS, and assessments aligned with DepEd standards. Built for Filipino public school teachers." },
      { property: "og:title", content: "TALA — Teaching Automation for Filipino Teachers" },
      { property: "og:description", content: "AI-powered lesson plans, TOS, and assessments for Filipino teachers." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const fetchSite = useServerFn(getSiteContent);
  const { data } = useQuery({ queryKey: ["site-public"], queryFn: () => fetchSite() });
  const s = data?.settings ?? {};
  const hero = (s.hero ?? {}) as { title?: string; subtitle?: string; cta?: string };
  const mission = (s.mission ?? {}) as { text?: string };
  const vision = (s.vision ?? {}) as { text?: string };
  const about = (s.about ?? {}) as { text?: string };
  const footer = (s.footer ?? {}) as { text?: string };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-navy text-navy-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">TALA</span>
          </Link>
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            <Link to="/" className="hover:text-primary">Home</Link>
            <Link to="/about" className="hover:text-primary">About</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" search={{ mode: "login" }} className="text-sm font-medium hover:text-primary">Sign in</Link>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FDBA2D]/20 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FDBA2D]">
                <Sparkles className="h-3.5 w-3.5" /> Aligned with the MATATAG Curriculum
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
                Empowering Teachers.
                <br />
                <span className="text-[#FDBA2D]">Enriching Education.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-navy-foreground/85 md:text-lg">
                {hero.subtitle ??
                  "TALA empowers teachers to create, automate, assess, and inspire learning through intelligent educational tools aligned with the MATATAG Curriculum."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  search={{ mode: "register" }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FDBA2D] to-[#F59E0B] px-5 py-3 text-sm font-bold text-navy shadow-lg transition hover:scale-[1.03]"
                >
                  {hero.cta ?? "Let's Get Started"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold hover:bg-white/10"
                >
                  Learn more
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 p-10">
                <div className="rounded-2xl bg-card p-6 shadow-2xl">
                  <div className="mb-4 h-2 w-24 rounded-full bg-primary/30" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="grid h-6 w-6 place-items-center rounded bg-success/15 text-success">
                          ✓
                        </div>
                        <div className="h-3 flex-1 rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <div className="mb-2 h-2 w-12 rounded bg-primary/40" />
                      <div className="h-8 rounded bg-primary/20" />
                    </div>
                    <div className="rounded-lg bg-warning/15 p-3">
                      <div className="mb-2 h-2 w-16 rounded bg-warning/60" />
                      <div className="h-8 rounded bg-warning/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>




      {/* Mission / Vision */}
      <section className="border-y bg-muted/30 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-8 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Our Mission</h2>
            <p className="mt-3 text-lg font-medium">{mission.text}</p>
          </div>
          <div className="rounded-2xl bg-card p-8 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Our Vision</h2>
            <p className="mt-3 text-lg font-medium">{vision.text}</p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">About TALA</h2>
        <p className="mt-4 text-muted-foreground">{about.text}</p>
      </section>

      <TalaFooter />
      <div className="sr-only">{footer.text}</div>
    </div>
  );
}
