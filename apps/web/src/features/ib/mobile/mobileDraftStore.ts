"use client";

import { readOfflineStore, writeOfflineStore } from "@/features/ib/offline/offlineStore";

const DRAFTS_KEY = "mobile_drafts";
const CONFLICTS_KEY = "mobile_conflicts";
const CHANGE_EVENT = "ib:mobile-offline-state";

export interface IbMobileDraftRecord {
  id: string;
  title: string;
  summary: string;
  programme: string;
  attachmentNames: string[];
  curriculumDocumentId?: number | null;
  operationalRecordId?: number | null;
  storyId?: number | null;
  status: "queued" | "attachment_retry" | "conflict";
  createdAt: string;
}

export interface IbMobileConflictRecord {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
}

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

export function mobileOfflineChangeEventName() {
  return CHANGE_EVENT;
}

export function listMobileDrafts() {
  return readOfflineStore<IbMobileDraftRecord[]>(DRAFTS_KEY, []);
}

export function upsertMobileDraft(record: IbMobileDraftRecord) {
  const drafts = listMobileDrafts();
  const nextDrafts = [...drafts.filter((draft) => draft.id !== record.id), record];
  writeOfflineStore(DRAFTS_KEY, nextDrafts);
  emitChange();
  return record;
}

export function removeMobileDraft(id: string) {
  writeOfflineStore(
    DRAFTS_KEY,
    listMobileDrafts().filter((draft) => draft.id !== id),
  );
  emitChange();
}

export function listMobileConflicts() {
  return readOfflineStore<IbMobileConflictRecord[]>(CONFLICTS_KEY, []);
}

export function recordMobileConflict(record: IbMobileConflictRecord) {
  const conflicts = listMobileConflicts();
  writeOfflineStore(CONFLICTS_KEY, [...conflicts.filter((item) => item.id !== record.id), record]);
  emitChange();
  return record;
}

export function clearMobileConflict(id: string) {
  writeOfflineStore(
    CONFLICTS_KEY,
    listMobileConflicts().filter((conflict) => conflict.id !== id),
  );
  emitChange();
}
