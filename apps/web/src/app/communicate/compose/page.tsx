"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ApiError, apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { announce } from "@k12/ui";
import { useToast } from "@k12/ui";
import { FormActions, FormField, Select, TextArea, TextInput } from "@k12/ui/forms";

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
  const { addToast } = useToast();

  const [subject, setSubject] = useState("");
  const [threadType, setThreadType] = useState("direct");
  const [messageBody, setMessageBody] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchRow[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<UserSearchRow[]>([]);

  const [sending, setSending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => new Set(selectedRecipients.map((recipient) => recipient.id)),
    [selectedRecipients],
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const rows = await apiFetch<UserSearchRow[]>(
          `/api/v1/users?q=${encodeURIComponent(searchQuery.trim())}`,
        );
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
    setSelectedRecipients((current) => [...current, recipient]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeRecipient(recipientId: number) {
    setSelectedRecipients((current) => current.filter((recipient) => recipient.id !== recipientId));
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!subject.trim() || !messageBody.trim() || selectedRecipients.length === 0) {
      setValidationError("Subject, recipients, and message are required.");
      announce("Message form has validation errors");
      return;
    }

    setSending(true);
    setValidationError(null);

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

      announce("Message sent");
      router.push(`/communicate/threads/${thread.id}`);
    } catch (sendError) {
      announce("Failed to send message");
      addToast(
        "error",
        sendError instanceof ApiError ? sendError.message : "Failed to send message.",
      );
      setSending(false);
    }
  }

  const showValidationErrors = Boolean(validationError);
  const subjectError = showValidationErrors && !subject.trim() ? "Subject is required." : undefined;
  const recipientError =
    showValidationErrors && selectedRecipients.length === 0
      ? "At least one recipient is required."
      : undefined;
  const messageError =
    showValidationErrors && !messageBody.trim() ? "Message is required." : undefined;

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

          {validationError && (
            <div
              id="compose-form-error"
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-700"
            >
              {validationError}
            </div>
          )}

          <form
            onSubmit={(event) => void sendMessage(event)}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Subject" htmlFor="compose-subject" required error={subjectError}>
                <TextInput
                  id="compose-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Enter subject"
                  required
                  error={Boolean(subjectError)}
                />
              </FormField>

              <FormField label="Thread Type" htmlFor="compose-thread-type">
                <Select
                  id="compose-thread-type"
                  value={threadType}
                  onChange={(event) => setThreadType(event.target.value)}
                >
                  <option value="direct">direct</option>
                  <option value="course">course</option>
                  <option value="group">group</option>
                </Select>
              </FormField>
            </div>

            <div className="space-y-2">
              <FormField
                label="Recipients"
                htmlFor="compose-recipients-search"
                required
                error={recipientError}
              >
                <TextInput
                  id="compose-recipients-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search users by name"
                  error={Boolean(recipientError)}
                />
              </FormField>

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
                      <p className="font-medium text-gray-900">
                        {fullName(result) || result.email}
                      </p>
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

            <FormField label="Message" htmlFor="compose-message-body" required error={messageError}>
              <TextArea
                id="compose-message-body"
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                rows={6}
                required
                placeholder="Write your message"
                error={Boolean(messageError)}
              />
            </FormField>

            <FormActions
              submitLabel="Send"
              submittingLabel="Sending..."
              submitting={sending}
              submitDisabled={
                !subject.trim() || !messageBody.trim() || selectedRecipients.length === 0
              }
            />
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
