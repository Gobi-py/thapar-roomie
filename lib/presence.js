import { supabase } from "./supabaseClient";

const CHANNEL_NAME = "online-users";

// A single shared channel connection for the whole app/tab — created only
// once, no matter how many components ask for it. This avoids the
// "cannot add presence callbacks after subscribe()" error that happens
// if two different components each try to create their own channel with
// the same name.
let channel = null;
let isSubscribed = false;
let onlineIds = new Set();
const listeners = new Set();

function computeOnlineIds() {
  const state = channel.presenceState();
  const ids = new Set();
  Object.values(state).forEach((presences) => {
    presences.forEach((p) => {
      if (p.user_id) ids.add(p.user_id);
    });
  });
  return ids;
}

function getChannel() {
  if (channel) return channel;

  channel = supabase.channel(CHANNEL_NAME);

  channel.on("presence", { event: "sync" }, () => {
    onlineIds = computeOnlineIds();
    listeners.forEach((cb) => cb(onlineIds));
  });

  channel.subscribe((status) => {
    isSubscribed = status === "SUBSCRIBED";
  });

  return channel;
}

// Announce the current user as online. Safe to call from multiple
// components/pages — they all share the same underlying connection.
export function trackPresence(userId) {
  const ch = getChannel();

  function tryTrack() {
    if (isSubscribed) {
      ch.track({ user_id: userId, online_at: new Date().toISOString() });
    } else {
      setTimeout(tryTrack, 200);
    }
  }
  tryTrack();

  return () => {
    // Intentionally a no-op: we keep the shared connection alive across
    // page navigations. It naturally disconnects when the tab closes.
  };
}

// Listen for changes to who's online. onChange receives a Set of user ids
// that are currently online.
export function subscribeOnlineUsers(onChange) {
  getChannel();
  onChange(onlineIds);
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}