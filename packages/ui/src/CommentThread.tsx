"use client";

import { useState } from "react";

export interface ThreadComment {
  id: string;
  author: string;
  body: string;
  timestamp: string;
}

interface CommentThreadProps {
  comments: ThreadComment[];
  onSubmit?: (body: string) => void;
}

export function CommentThread({ comments, onSubmit }: CommentThreadProps) {
  const [draft, setDraft] = useState("");

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-3">
        {comments.map((comment) => (
          <article key={comment.id} className="rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{comment.author}</p>
              <span className="text-xs text-slate-400">{comment.timestamp}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{comment.body}</p>
          </article>
        ))}
      </div>
      {onSubmit ? (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Add a note or reflection"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                const next = draft.trim();
                if (!next) return;
                onSubmit(next);
                setDraft("");
              }}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Add Comment
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
