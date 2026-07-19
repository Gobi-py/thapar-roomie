import { supabase } from "./supabaseClient";

// Call this when a user opens a chat with someone, so those messages
// stop counting as unread.
export async function markConversationRead(myId, otherUserId) {
  await supabase.from("chat_reads").upsert(
    {
      user_id: myId,
      other_user_id: otherUserId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,other_user_id" }
  );
}

// Returns a Map of senderId -> unread message count, for every
// conversation the current user is part of.
export async function getUnreadCounts(myId) {
  const { data: messages } = await supabase
    .from("messages")
    .select("user_a, user_b, sender_id, created_at")
    .or(`user_a.eq.${myId},user_b.eq.${myId}`)
    .neq("sender_id", myId);

  const { data: reads } = await supabase
    .from("chat_reads")
    .select("other_user_id, last_read_at")
    .eq("user_id", myId);

  const readMap = new Map(
    (reads || []).map((r) => [r.other_user_id, r.last_read_at])
  );

  const counts = new Map();
  (messages || []).forEach((m) => {
    const otherId = m.user_a === myId ? m.user_b : m.user_a;
    const lastRead = readMap.get(otherId);
    if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
      counts.set(otherId, (counts.get(otherId) || 0) + 1);
    }
  });

  return counts;
}
