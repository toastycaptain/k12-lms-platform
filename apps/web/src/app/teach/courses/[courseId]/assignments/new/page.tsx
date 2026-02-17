"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { apiFetch } from "@/lib/api";
import { FormActions, FormField, Select, TextArea, TextInput } from "@k12/ui/forms";

export default function NewAssignmentPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignmentType, setAssignmentType] = useState("written");
  const [pointsPossible, setPointsPossible] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    try {
      const assignment = await apiFetch<{ id: number }>(`/api/v1/courses/${courseId}/assignments`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          instructions,
          assignment_type: assignmentType,
          points_possible: pointsPossible ? Number(pointsPossible) : null,
          due_at: dueAt || null,
        }),
      });
      router.push(`/teach/courses/${courseId}/assignments/${assignment.id}`);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <button
              onClick={() => router.push(`/teach/courses/${courseId}`)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              &larr; Back to course
            </button>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">New Assignment</h1>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
          >
            <FormField label="Title" htmlFor="assignment-title" required>
              <TextInput
                id="assignment-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </FormField>

            <FormField label="Type" htmlFor="assignment-type" required>
              <Select
                id="assignment-type"
                value={assignmentType}
                onChange={(event) => setAssignmentType(event.target.value)}
                required
              >
                <option value="written">Written</option>
                <option value="file_upload">File Upload</option>
                <option value="url">URL</option>
                <option value="discussion">Discussion</option>
              </Select>
            </FormField>

            <FormField label="Description" htmlFor="assignment-description">
              <TextArea
                id="assignment-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </FormField>

            <FormField label="Instructions" htmlFor="assignment-instructions">
              <TextArea
                id="assignment-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Points Possible" htmlFor="assignment-points">
                <TextInput
                  id="assignment-points"
                  type="number"
                  value={pointsPossible}
                  onChange={(event) => setPointsPossible(event.target.value)}
                />
              </FormField>

              <FormField label="Due Date" htmlFor="assignment-due-at">
                <TextInput
                  id="assignment-due-at"
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) => setDueAt(event.target.value)}
                />
              </FormField>
            </div>

            <FormActions
              submitLabel="Create Assignment"
              submittingLabel="Creating..."
              submitting={saving}
              submitDisabled={!title.trim()}
              onCancel={() => router.push(`/teach/courses/${courseId}`)}
            />
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
