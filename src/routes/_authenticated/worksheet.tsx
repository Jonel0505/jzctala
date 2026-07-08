import { createFileRoute } from "@tanstack/react-router";
import { EmbedFrame } from "@/components/tala/EmbedFrame";

export const Route = createFileRoute("/_authenticated/worksheet")({
  head: () => ({
    meta: [{ title: "Worksheet Maker — TALA" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <EmbedFrame
      title="Worksheet Maker"
      subtitle="Design engaging worksheets tailored to your objectives."
      src="https://jzcwsm.lovable.app/"
    />
  ),
});
