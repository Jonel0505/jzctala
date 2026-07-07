import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AvatarImg({
  path,
  fallback,
  className,
}: {
  path: string | null;
  fallback: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (alive) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      alive = false;
    };
  }, [path]);

  if (url) {
    return <img src={url} alt="avatar" className={(className ?? "") + " object-cover"} />;
  }
  return (
    <div
      className={
        (className ?? "") +
        " grid place-items-center bg-primary/20 text-primary text-xs font-bold"
      }
    >
      {fallback}
    </div>
  );
}
