import { createFileRoute } from "@tanstack/react-router";
import { EmbedFrame } from "@/components/tala/EmbedFrame";

export const Route = createFileRoute("/_authenticated/tos")({
  head: () => ({
    meta: [{ title: "Automated TOS with Test Generator — TALA" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <EmbedFrame
      title="Automated TOS with Test Generator"
      subtitle="Generate curriculum-aligned TOS and tests within TALA."
      src="https://jzctosgen.lovable.app/"
    />
  ),
});
