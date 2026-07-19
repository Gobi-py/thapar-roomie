"use client";
import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { trackPresence } from "../lib/presence";

export default function PresenceTracker() {
  useEffect(() => {
    let cleanup;
    let cancelled = false;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      cleanup = trackPresence(user.id);
    }

    init();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, []);

  return null;
}
