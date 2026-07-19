"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { subscribeOnlineUsers } from "../../../lib/presence";
import { markConversationRead } from "../../../lib/notifications";

export default function Chat() {
  const { matchId } = useParams(); // this is the other user's id
  const [myId, setMyId] = useState(null);
  const [otherName, setOtherName] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeOnlineUsers(setOnlineIds);
    return unsubscribe;
  }, []);

  useEffect(() => {
    let channel;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }
      setMyId(user.id);

      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", matchId)
        .single();
      if (otherProfile) setOtherName(otherProfile.name);

      const [a, b] = [user.id, matchId].sort();

      const { data: history } = await supabase
        .from("messages")
        .select("*")
        .eq("user_a", a)
        .eq("user_b", b)
        .order("created_at", { ascending: true });

      setMessages(history || []);
      setLoading(false);
      markConversationRead(user.id, matchId);

      channel = supabase
        .channel(`chat-${a}-${b}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `user_a=eq.${a}`,
          },
          (payload) => {
            if (payload.new.user_b === b) {
              setMessages((prev) => [...prev, payload.new]);
              if (payload.new.sender_id === matchId) {
                markConversationRead(user.id, matchId);
              }
            }
          }
        )
        .on("broadcast", { event: "typing" }, (payload) => {
          if (payload.payload.userId === matchId) {
            setOtherTyping(true);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setOtherTyping(false);
            }, 3000);
          }
        })
        .subscribe();

      channelRef.current = channel;
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  function handleInputChange(e) {
    setText(e.target.value);

    const now = Date.now();
    if (myId && channelRef.current && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: myId },
      });
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;

    const [a, b] = [myId, matchId].sort();

    await supabase.from("messages").insert({
      user_a: a,
      user_b: b,
      sender_id: myId,
      content: text.trim(),
    });

    setText("");
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) return <p>Loading chat...</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col h-[70vh]">
      <div className="border-b dark:border-gray-700 px-5 py-3 flex items-center gap-2">
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          {otherName}
        </span>
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${
            onlineIds.has(matchId)
              ? "bg-green-500"
              : "bg-gray-300 dark:bg-gray-600"
          }`}
        />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {onlineIds.has(matchId) ? "Online" : "Offline"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col max-w-[70%] ${
              m.sender_id === myId ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm ${
                m.sender_id === myId
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
              }`}
            >
              {m.content}
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">
              {formatTime(m.created_at)}
            </span>
          </div>
        ))}
        {otherTyping && (
          <div className="self-start bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm px-3 py-2 rounded-lg italic">
            {otherName} is typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="border-t dark:border-gray-700 p-3 flex gap-2">
        <input
          className="flex-1 border dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2"
          placeholder="Type a message..."
          value={text}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
