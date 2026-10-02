import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";
import { useAuth } from "../context/AuthContext";
import { conversationApi } from "../lib/api";

export default function Inbox() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(
    searchParams.get("c") ? Number(searchParams.get("c")) : null
  );
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [reviewTick, setReviewTick] = useState(0); // bump after review changes
  const bottomRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await conversationApi.list());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const timer = setInterval(loadConversations, 8000);
    return () => clearInterval(timer);
  }, [loadConversations]);

  const loadMessages = useCallback(
    async (id) => {
      if (!id) return;
      try {
        setMessages(await conversationApi.messages(id));
        conversationApi.markRead(id).catch(() => {});
        loadConversations();
      } catch (err) {
        setError(err.message);
      }
    },
    [loadConversations]
  );

  useEffect(() => {
    loadMessages(activeId);
    if (activeId) setSearchParams({ c: activeId }, { replace: true });
    const timer = activeId
      ? setInterval(() => loadMessages(activeId), 5000)
      : null;
    return () => timer && clearInterval(timer);
  }, [activeId, loadMessages, setSearchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !activeId) return;
    setDraft("");
    try {
      const sent = await conversationApi.send(activeId, content);
      setMessages((m) => [...m, sent]);
      loadConversations();
    } catch (err) {
      setError(err.message);
      setDraft(content);
    }
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Conversation list */}
      <div className="rounded-2xl border border-gray-200">
        <div className="border-b border-gray-100 px-4 py-3">
          <h1 className="font-black">Inbox</h1>
          <p className="text-xs text-gray-500">
            Arrange meetups with students at {user?.schoolDomain}
          </p>
        </div>
        <ul className="max-h-[70vh] divide-y divide-gray-100 overflow-y-auto scroll-thin">
          {conversations.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">
              No messages yet. Find a listing and message the seller!
            </li>
          )}
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                  activeId === c.id ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                  {c.product?.images?.[0] ? (
                    <img
                      src={c.product.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      💬
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {c.otherUser.username}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="rounded-full bg-[#ff2300] px-2 py-0.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {c.product ? `${c.product.title}: ` : ""}
                    {c.lastMessage || "Say hi 👋"}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Chat pane */}
      <div className="flex min-h-[60vh] flex-col rounded-2xl border border-gray-200 lg:col-span-2">
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-gray-500">
            <p className="text-4xl">📭</p>
            <p className="mt-2 font-semibold text-black">Pick a conversation</p>
            <p className="text-sm">
              Unipop has no checkout — agree on a time and a public campus spot,
              then exchange in person.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold">{active.otherUser.username}</p>
                <p className="text-xs text-gray-500">
                  {active.product ? "About: " : "General chat"}
                  {active.product && (
                    <Link
                      to={`/listing/${active.product.id}`}
                      className="font-semibold text-black underline decoration-gray-300 underline-offset-2 hover:decoration-black"
                    >
                      {active.product.title}
                    </Link>
                  )}
                  {active.product && (
                    <> · ${active.product.price?.toFixed(2)}</>
                  )}
                </p>
              </div>
              {active.product && (
                <Link
                  to={`/listing/${active.product.id}`}
                  className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-bold hover:border-black"
                >
                  View listing →
                </Link>
              )}
            </div>

            {/* Leave a review for the student you've been chatting with */}
            <div className="border-b border-gray-100 px-4 py-2">
              <ReviewForm
                sellerId={active.otherUser.id}
                label={`⭐ Review @${active.otherUser.username}`}
                refreshKey={reviewTick}
                onChanged={() => setReviewTick((t) => t + 1)}
              />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto scroll-thin p-4">
              {messages.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mine
                          ? "rounded-br-sm bg-black text-white"
                          : "rounded-bl-sm bg-gray-100 text-black"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? "text-gray-400" : "text-gray-400"
                        }`}
                      >
                        {m.sentAt
                          ? new Date(m.sentAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {error && (
              <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={send}
              className="flex gap-2 border-t border-gray-100 p-3"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message… (suggest a meetup spot on campus)"
                maxLength={2000}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-black focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-full bg-[#ff2300] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
