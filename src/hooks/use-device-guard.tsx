import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { registerMyDevice } from "@/lib/user.functions";
import { supabase } from "@/integrations/supabase/client";

const KEY = "tala_device_id";

function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let v = localStorage.getItem(KEY);
  if (!v) {
    v = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2));
    localStorage.setItem(KEY, v);
  }
  return v;
}

export function useDeviceGuard() {
  const register = useServerFn(registerMyDevice);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const device_id = getDeviceId();
    if (!device_id) return;
    register({ data: { device_id, user_agent: navigator.userAgent.slice(0, 500) } })
      .then(async (res) => {
        if (!res.allowed) {
          toast.error(res.reason ?? "This device is not authorized.");
          await qc.cancelQueries();
          qc.clear();
          await supabase.auth.signOut();
          navigate({ to: "/auth", replace: true });
        }
      })
      .catch(() => {
        // ignore transient errors
      });
  }, [register, navigate, qc]);
}
