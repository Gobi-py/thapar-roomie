"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let channel;
    let myId = null;
    const nameCache = new Map();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      myId = user.id;

      channel = supabase
        .channel(`toast-watch-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async (payload) => {
            const m = payload.new;
            if (m.sender_id === myId) return;
            if (m.user_a !== myId && m.user_b !== myId) return;

            // Don't pop a toast if they're already looking at that chat.
            if (pathname === `/chat/${m.sender_id}`) return;

            let name = nameCache.get(m.sender_id);
            if (!name) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", m.sender_id)
                .single();
              name = profile?.name || "Someone";
              nameCache.set(m.sender_id, name);
            }

            const id = Date.now() + Math.random();
            setToasts((prev) => [
              ...prev,
              { id, senderId: m.sender_id, name, content: m.content },
            ]);
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 5000);
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [pathname]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => router.push(`/chat/${t.senderId}`)}
          className="text-left bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            💬 {t.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {t.content}
          </p>
        </button>
      ))}
    </div>
  );
}
