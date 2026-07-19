"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { computeCompatibility } from "../../lib/matching";
import { subscribeOnlineUsers } from "../../lib/presence";
import { getUnreadCounts } from "../../lib/notifications";

export default function Matches() {
  const [me, setMe] = useState(null);
  const [ranked, setRanked] = useState([]);
  const [myLikes, setMyLikes] = useState([]);
  const [theirLikes, setTheirLikes] = useState([]);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    load();
    const unsubscribe = subscribeOnlineUsers(setOnlineIds);

    let channel;
    async function watchForNewMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`unread-watch-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const m = payload.new;
            if (m.sender_id === user.id) return;
            if (m.user_a !== user.id && m.user_b !== user.id) return;
            setUnreadCounts((prev) => {
              const next = new Map(prev);
              next.set(m.sender_id, (next.get(m.sender_id) || 0) + 1);
              return next;
            });
          }
        )
        .subscribe();
    }
    watchForNewMessages();

    return () => {
      unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!myProfile) {
      router.push("/profile");
      return;
    }
    setMe(myProfile);

    if (!myProfile.gender) {
      setLoading(false);
      return;
    }

    const { data: others } = await supabase
      .from("profiles")
      .select("*")
      .eq("gender", myProfile.gender)
      .neq("id", user.id);

    const scored = (others || [])
      .map((p) => ({ profile: p, score: computeCompatibility(myProfile, p) }))
      .sort((a, b) => b.score - a.score);
    setRanked(scored);

    const { data: sentLikes } = await supabase
      .from("likes")
      .select("to_user")
      .eq("from_user", user.id);
    setMyLikes((sentLikes || []).map((l) => l.to_user));

    const { data: receivedLikes } = await supabase
      .from("likes")
      .select("from_user")
      .eq("to_user", user.id);
    setTheirLikes((receivedLikes || []).map((l) => l.from_user));

    const counts = await getUnreadCounts(user.id);
    setUnreadCounts(counts);

    setLoading(false);
  }

  async function handleLike(otherId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase
      .from("likes")
      .insert({ from_user: user.id, to_user: otherId });

    setMyLikes((prev) => [...prev, otherId]);
  }

  // Online people first, compatibility score decides the order within
  // each group. Recomputes automatically whenever someone comes online
  // or goes offline.
  const sortedRanked = useMemo(() => {
    return [...ranked].sort((a, b) => {
      const aOnline = onlineIds.has(a.profile.id);
      const bOnline = onlineIds.has(b.profile.id);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return b.score - a.score;
    });
  }, [ranked, onlineIds]);

  if (loading) return <p>Loading matches...</p>;

  if (me && !me.gender) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <p className="text-gray-700 dark:text-gray-300 mb-3">
          We've added gender-based matching. Please update your profile and
          select your gender so we can show you the right matches.
        </p>
        <a
          href="/profile"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 inline-block"
        >
          Update Profile
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Your Top Matches</h1>
      <div className="flex flex-col gap-4">
        {ranked.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            No other profiles yet. Check back once more people sign up!
          </p>
        )}
        {sortedRanked.map(({ profile, score }, index) => {
          const iLiked = myLikes.includes(profile.id);
          const theyLiked = theirLikes.includes(profile.id);
          const mutual = iLiked && theyLiked;
          const isOnline = onlineIds.has(profile.id);
          const prevOnline =
            index > 0 ? onlineIds.has(sortedRanked[index - 1].profile.id) : null;
          const showOfflineDivider = !isOnline && prevOnline !== false && index > 0;

          return (
            <div key={profile.id}>
              {index === 0 && isOnline && (
                <p className="text-xs uppercase tracking-wide text-green-600 dark:text-green-400 mb-1">
                  Online
                </p>
              )}
              {showOfflineDivider && (
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-2 mb-1">
                  Offline
                </p>
              )}
              <div
                className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm flex justify-between items-center"
              >
              <div>
                <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  {profile.name}
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isOnline
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    title={isOnline ? "Online" : "Offline"}
                  />
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.branch} · Year {profile.year}
                </p>
                {profile.hostel_pref && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    🏠 {profile.hostel_pref}
                  </p>
                )}
                <p className="text-sm text-indigo-600 font-medium mt-1">
                  {score}% compatible
                </p>
                {theyLiked && !iLiked && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    They liked you!
                  </p>
                )}
              </div>
              <div className="relative">
                {mutual ? (
                  <a
                    href={`/chat/${profile.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 inline-block"
                  >
                    Chat 💬
                  </a>
                ) : iLiked ? (
                  <span className="text-sm text-gray-400 dark:text-gray-500 px-4 py-2">
                    Liked ✓
                  </span>
                ) : (
                  <button
                    onClick={() => handleLike(profile.id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                  >
                    Like
                  </button>
                )}
                {unreadCounts.get(profile.id) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCounts.get(profile.id) > 9
                      ? "9+"
                      : unreadCounts.get(profile.id)}
                  </span>
                )}
              </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
