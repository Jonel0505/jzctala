import { createFileRoute } from "@tanstack/react-router";
import { EmbedFrame } from "@/components/tala/EmbedFrame";

export const Route = createFileRoute("/_authenticated/ppt")({
  head: () => ({
    meta: [{ title: "PPT Maker — TALA" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <EmbedFrame
      title="PPT Maker"
      subtitle="Create professional presentations in minutes."
      src="https://jzcppt.lovable.app/"
    />
  ),
});
