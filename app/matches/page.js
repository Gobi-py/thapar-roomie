"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { computeCompatibility } from "../../lib/matching";

export default function Matches() {
  const [me, setMe] = useState(null);
  const [ranked, setRanked] = useState([]);
  const [myLikes, setMyLikes] = useState([]);
  const [theirLikes, setTheirLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    load();
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

  if (loading) return <p>Loading matches...</p>;

  if (me && !me.gender) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <p className="text-gray-700 mb-3">
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
      <h1 className="text-2xl font-bold mb-6">Your Top Matches</h1>
      <div className="flex flex-col gap-4">
        {ranked.length === 0 && (
          <p className="text-gray-500">
            No other profiles yet. Check back once more people sign up!
          </p>
        )}
        {ranked.map(({ profile, score }) => {
          const iLiked = myLikes.includes(profile.id);
          const theyLiked = theirLikes.includes(profile.id);
          const mutual = iLiked && theyLiked;

          return (
            <div
              key={profile.id}
              className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">{profile.name}</p>
                <p className="text-sm text-gray-500">
                  {profile.branch} · Year {profile.year}
                </p>
                {profile.hostel_pref && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    🏠 {profile.hostel_pref}
                  </p>
                )}
                <p className="text-sm text-indigo-600 font-medium mt-1">
                  {score}% compatible
                </p>
                {theyLiked && !iLiked && (
                  <p className="text-xs text-green-600 mt-1">
                    They liked you!
                  </p>
                )}
              </div>
              <div>
                {mutual ? (
                  <a
                    href={`/chat/${profile.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    Chat 💬
                  </a>
                ) : iLiked ? (
                  <span className="text-sm text-gray-400 px-4 py-2">
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
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
