import { useEffect, useRef, useState } from "react";
import { Bot, X, Send, RefreshCw, Loader2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useIsMobile } from "@/hooks/use-mobile";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "tala-assistant-history-v1";
const GREETING: Msg = {
  role: "assistant",
  content:
    "Kumusta po! I'm **TALA**, your teaching companion. Tanungin niyo ako tungkol sa MATATAG Curriculum, K–12, MELCs, ILAW lesson plans, TOS, rubrics — English or Filipino, kayo ang bahala. 🌟",
};

export function TalaAssistant() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted history once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/tala-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: next
            .slice(0, -1) // drop empty assistant placeholder
            .filter((m) => m.content.length > 0)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => res.statusText);
        throw new Error(err || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      const err = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) => {
        const copy = prev.slice();
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${err}` };
        return copy;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const newChat = () => {
    abortRef.current?.abort();
    setMessages([GREETING]);
    setInput("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const panelClasses = isMobile
    ? "fixed inset-x-0 bottom-0 z-[60] flex h-[85vh] flex-col rounded-t-3xl border-t bg-card shadow-2xl"
    : "fixed bottom-24 right-6 z-[60] flex h-[600px] max-h-[80vh] w-[400px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border bg-card shadow-2xl";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close TALA Assistant" : "Open TALA Assistant"}
        className="fixed bottom-6 right-6 z-[59] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-white shadow-xl transition hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-card" />
        )}
      </button>

      {open && (
        <div className={panelClasses}>
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl border-b bg-gradient-to-r from-primary to-indigo-600 p-4 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold leading-tight">TALA Assistant</div>
              <div className="text-[11px] text-white/80">MATATAG • K–12 • Revised K–10 aware</div>
            </div>
            <button
              onClick={newChat}
              title="New chat"
              className="rounded-lg p-2 text-white/90 hover:bg-white/15"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              title="Close"
              className="rounded-lg p-2 text-white/90 hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={"flex gap-2 " + (m.role === "user" ? "flex-row-reverse" : "")}>
                <div
                  className={
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-indigo-100 text-indigo-600")
                  }
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={
                    "max-w-[80%] rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-ol:my-1.5">
                      {m.content ? (
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 border-t bg-card p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Ask TALA in English or Filipino…"
              className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border bg-muted/40 px-3 py-2.5 text-sm outline-none focus:border-primary focus:bg-card"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow disabled:opacity-50"
              aria-label="Send"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
