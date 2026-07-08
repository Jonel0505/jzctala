import { createFileRoute } from "@tanstack/react-router";
import { EmbedFrame } from "@/components/tala/EmbedFrame";

export const Route = createFileRoute("/_authenticated/lesson-plans")({
  head: () => ({
    meta: [{ title: "Lesson Plan Maker (ILAW) — TALA" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <EmbedFrame
      title="Lesson Plan Maker (ILAW)"
      subtitle="Create ILAW-formatted lesson plans powered by the embedded generator."
      src="https://jzcilawdlp.lovable.app/"
    />
  ),
});
