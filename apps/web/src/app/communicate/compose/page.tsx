"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface UserSearchRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface MessageThreadResponse {
  id: number;
}

function fullName(user: Pick<UserSearchRow, "first_name" | "last_name">): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export default function ComposeMessagePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [subject, setSubject] = useState("");
  const [threadType, setThreadType] = useState("direct");
  const [messageBody, setMessageBody] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchRow[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<UserSearchRow[]>([]);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(selectedRecipients.map((recipient) => recipient.id)), [selectedRecipients]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const rows = await apiFetch<UserSearchRow[]>(`/api/v1/users?q=${encodeURIComponent(searchQuery.trim())}`);
        const filtered = rows.filter((row) => row.id !== user?.id);
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  function addRecipient(recipient: UserSearchRow) {
    if (selectedIds.has(recipient.id)) return;
    setSelectedRecipients((current) => [ ...current, recipient ]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeRecipient(recipientId: number) {
    setSelectedRecipients((current) => current.filter((recipient) => recipient.id !== recipientId));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subject.trim() || !messageBody.trim() || selectedRecipients.length === 0) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const thread = await apiFetch<MessageThreadResponse>("/api/v1/message_threads", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          thread_type: threadType,
          participant_ids: selectedRecipients.map((recipient) => recipient.id),
        }),
      });

      await apiFetch(`/api/v1/message_threads/${thread.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: messageBody.trim() }),
      });

      router.push(`/communicate/threads/${thread.id}`);
    } catch (sendError) {
      setError(sendError instanceof ApiError ? sendError.message : "Failed to send message.");
      setSending(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <Link href="/communicate" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to Messages
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Compose Message</h1>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={(event) => void sendMessage(event)} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Enter subject"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Thread Type</label>
                <select
                  value={threadType}
                  onChange={(event) => setThreadType(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="direct">direct</option>
                  <option value="course">course</option>
                  <option value="group">group</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Recipients</label>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search users by name"
              />

              {searchLoading && <p className="mt-1 text-xs text-gray-500">Searching...</p>}

              {!searchLoading && searchResults.length > 0 && (
                <div className="mt-2 rounded border border-gray-200 bg-white">
                  {searchResults.slice(0, 8).map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => addRecipient(result)}
                      className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-900">{fullName(result) || result.email}</p>
                      <p className="text-xs text-gray-500">{result.email}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedRecipients.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => removeRecipient(recipient.id)}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800"
                    >
                      {fullName(recipient) || recipient.email} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                rows={6}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                placeholder="Write your message"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !subject.trim() || !messageBody.trim() || selectedRecipients.length === 0}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
