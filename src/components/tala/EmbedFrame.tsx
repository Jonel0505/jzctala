import { AppShell } from "./AppShell";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

export function EmbedFrame({
  title,
  subtitle,
  src,
}: {
  title: string;
  subtitle: string;
  src: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <AppShell title={title}>
      <div className="flex h-[calc(100vh-3.5rem)] flex-col p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            Open in new tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="relative flex-1 overflow-hidden rounded-2xl border bg-card shadow-sm">
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading tool…
              </div>
            </div>
          )}
          <iframe
            src={src}
            title={title}
            onLoad={() => setLoaded(true)}
            className="h-full w-full"
            allow="clipboard-read; clipboard-write; fullscreen"
          />
        </div>
      </div>
    </AppShell>
  );
}
