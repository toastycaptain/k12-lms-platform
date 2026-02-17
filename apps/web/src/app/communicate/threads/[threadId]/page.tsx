"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@k12/ui";

interface Participant {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface Sender {
  id: number;
  first_name: string;
  last_name: string;
  roles: string[];
}

interface Message {
  id: number;
  message_thread_id: number;
  sender_id: number;
  body: string;
  sender: Sender;
  created_at: string;
}

interface MessageThread {
  id: number;
  subject: string;
  thread_type: string;
  participants: Participant[];
  messages: Message[];
}

function formatDate(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "Unknown date";
  return new Date(parsed).toLocaleString();
}

function fullName(value: { first_name: string; last_name: string }): string {
  return `${value.first_name} ${value.last_name}`.trim();
}

function roleLabel(roles: string[]): string {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("teacher")) return "teacher";
  if (roles.includes("curriculum_lead")) return "curriculum_lead";
  if (roles.includes("student")) return "student";
  return "member";
}

export default function MessageThreadDetailPage() {
  const params = useParams();
  const threadId = String(params.threadId);
  const { user } = useAuth();

  const [thread, setThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadThread() {
      setLoading(true);
      setError(null);
      try {
        const [threadResponse, messageRows] = await Promise.all([
          apiFetch<MessageThread>(`/api/v1/message_threads/${threadId}`),
          apiFetch<Message[]>(`/api/v1/message_threads/${threadId}/messages`),
        ]);
        setThread(threadResponse);
        setMessages(messageRows);
      } catch (loadError) {
        setError(loadError instanceof ApiError ? loadError.message : "Failed to load thread.");
      } finally {
        setLoading(false);
      }
    }

    void loadThread();
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const participantsLabel = useMemo(() => {
    if (!thread) return "";
    return thread.participants.map(fullName).filter(Boolean).join(", ");
  }, [thread]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    setSending(true);
    setError(null);

    try {
      const created = await apiFetch<Message>(`/api/v1/message_threads/${threadId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() }),
      });
      setMessages((current) => [...current, created]);
      setBody("");
    } catch (sendError) {
      setError(sendError instanceof ApiError ? sendError.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto flex h-[calc(100vh-11rem)] max-w-4xl flex-col gap-4">
          <div className="space-y-2">
            <Link href="/communicate" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to Messages
            </Link>

            {thread && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">{thread.subject}</h1>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {thread.thread_type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{participantsLabel}</p>
              </div>
            )}
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4">
            {loading ? (
              <ListSkeleton />
            ) : !thread ? (
              <EmptyState
                title="Thread not found"
                description="This thread may have been removed."
              />
            ) : messages.length === 0 ? (
              <EmptyState
                title="No messages yet"
                description="Send a message to start the conversation."
              />
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const fromCurrentUser = message.sender_id === user?.id;
                  const senderRole = roleLabel(message.sender?.roles || []);

                  return (
                    <div
                      key={message.id}
                      className={`flex ${fromCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <article
                        className={`max-w-[80%] rounded-lg p-3 ${fromCurrentUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold">
                            {message.sender
                              ? fullName(message.sender)
                              : `User #${message.sender_id}`}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${fromCurrentUser ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"}`}
                          >
                            {senderRole}
                          </span>
                          <span
                            className={`text-[10px] ${fromCurrentUser ? "text-blue-100" : "text-gray-500"}`}
                          >
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
                      </article>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => void sendMessage(event)}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a message"
                rows={2}
                className="min-h-16 w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !body.trim() || !thread}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
