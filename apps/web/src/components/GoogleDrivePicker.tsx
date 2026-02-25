"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { apiFetch } from "@/lib/api";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  size?: number;
  modifiedTime?: string;
  fileIcon?: string;
}

interface GoogleDrivePickerProps {
  onSelect: (file: DriveFile) => void;
  onSelectMany?: (files: DriveFile[]) => void;
  children: React.ReactNode;
}

interface PickerDoc {
  id: string;
  name?: string;
  title?: string;
  mimeType?: string;
  url?: string;
  iconUrl?: string;
  thumbnailUrl?: string;
  sizeBytes?: string | number;
  lastEditedUtc?: string;
}

interface DriveCreateResponse {
  id: string;
  name?: string;
  title?: string;
  mime_type?: string;
  url?: string;
  icon_link?: string;
  thumbnail_link?: string;
  preview_url?: string;
  size?: number;
  modified_time?: string;
  file_icon?: string;
}

type CreateType = "doc" | "sheet" | "slide" | "form";

const CREATE_CONFIG: Record<
  CreateType,
  {
    label: string;
    endpoint: string;
    body: () => Record<string, string>;
  }
> = {
  doc: {
    label: "Doc",
    endpoint: "/api/v1/drive/documents",
    body: () => ({ title: "Untitled Doc", mime_type: "application/vnd.google-apps.document" }),
  },
  sheet: {
    label: "Sheet",
    endpoint: "/api/v1/drive/documents",
    body: () => ({
      title: "Untitled Sheet",
      mime_type: "application/vnd.google-apps.spreadsheet",
    }),
  },
  slide: {
    label: "Slide",
    endpoint: "/api/v1/drive/presentations",
    body: () => ({ title: "Untitled Slide" }),
  },
  form: {
    label: "Form",
    endpoint: "/api/v1/drive/documents",
    body: () => ({ title: "Untitled Form", mime_type: "application/vnd.google-apps.form" }),
  },
};

function iconFromMimeType(mimeType: string) {
  if (mimeType.includes("spreadsheet")) return "SHEET";
  if (mimeType.includes("presentation")) return "SLIDE";
  if (mimeType.includes("form")) return "FORM";
  if (mimeType.includes("folder")) return "FOLDER";
  if (mimeType.includes("image")) return "IMG";
  if (mimeType.includes("video")) return "VIDEO";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("document")) return "DOC";
  return "FILE";
}

function normalizePickedDoc(doc: PickerDoc): DriveFile {
  const mimeType = doc.mimeType || "application/octet-stream";
  const modifiedTime = doc.lastEditedUtc
    ? new Date(Number(doc.lastEditedUtc)).toISOString()
    : undefined;
  const size = doc.sizeBytes ? Number(doc.sizeBytes) : undefined;
  return {
    id: doc.id,
    name: doc.name || doc.title || "Untitled",
    mimeType,
    url: doc.url || `https://drive.google.com/file/d/${doc.id}/view`,
    iconUrl: doc.iconUrl,
    thumbnailUrl: doc.thumbnailUrl,
    previewUrl: `https://drive.google.com/file/d/${doc.id}/preview`,
    size,
    modifiedTime,
    fileIcon: iconFromMimeType(mimeType),
  };
}

function normalizeCreatedFile(file: DriveCreateResponse): DriveFile {
  const mimeType = file.mime_type || "application/octet-stream";
  return {
    id: file.id,
    name: file.title || file.name || "Untitled",
    mimeType,
    url: file.url || `https://drive.google.com/file/d/${file.id}/view`,
    iconUrl: file.icon_link,
    thumbnailUrl: file.thumbnail_link,
    previewUrl: file.preview_url || `https://drive.google.com/file/d/${file.id}/preview`,
    size: file.size,
    modifiedTime: file.modified_time,
    fileIcon: file.file_icon || iconFromMimeType(mimeType),
  };
}

function formatSize(size?: number) {
  if (!size || Number.isNaN(size)) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatModifiedDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

export default function GoogleDrivePicker({
  onSelect,
  onSelectMany,
  children,
}: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createType, setCreateType] = useState<CreateType>("doc");
  const [selectedFiles, setSelectedFiles] = useState<DriveFile[]>([]);

  const emitSelection = useCallback(
    (files: DriveFile[]) => {
      if (files.length === 0) return;

      onSelectMany?.(files);
      files.forEach((file) => onSelect(file));
      setSelectedFiles((previous) => {
        const merged = [...files, ...previous];
        const deduped: DriveFile[] = [];
        const seen = new Set<string>();
        for (const file of merged) {
          if (seen.has(file.id)) continue;
          seen.add(file.id);
          deduped.push(file);
        }
        return deduped.slice(0, 8);
      });
    },
    [onSelect, onSelectMany],
  );

  const openPicker = useCallback(async () => {
    setLoading(true);
    try {
      const tokenData = await apiFetch<{ access_token: string; expires_in: number }>(
        "/api/v1/drive/picker_token",
      );

      // Load Google Picker API
      await new Promise<void>((resolve, reject) => {
        if (window.google?.picker) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => {
          window.gapi.load("picker", () => resolve());
        };
        script.onerror = () => reject(new Error("Failed to load Google Picker API"));
        document.head.appendChild(script);
      });

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
      const pickerBuilder = new window.google.picker.PickerBuilder()
        .setOAuthToken(tokenData.access_token)
        .setAppId(clientId)
        .addView(window.google.picker.ViewId.DOCS)
        .addView(window.google.picker.ViewId.PRESENTATIONS)
        .addView(window.google.picker.ViewId.SPREADSHEETS)
        .setCallback((data: { action: string; docs?: PickerDoc[] }) => {
          if (data.action === "picked" && data.docs?.length) {
            emitSelection(data.docs.map(normalizePickedDoc));
          }
        });

      if (
        window.google.picker.Feature?.MULTISELECT_ENABLED &&
        typeof pickerBuilder.enableFeature === "function"
      ) {
        pickerBuilder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
      }

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [emitSelection]);

  const createNewFile = useCallback(async () => {
    setCreating(true);
    try {
      const config = CREATE_CONFIG[createType];
      const created = await apiFetch<DriveCreateResponse>(config.endpoint, {
        method: "POST",
        body: JSON.stringify(config.body()),
      });
      emitSelection([normalizeCreatedFile(created)]);
    } catch {
      // Handle error silently
    } finally {
      setCreating(false);
    }
  }, [createType, emitSelection]);

  return (
    <div className="space-y-2">
      <button onClick={openPicker} disabled={loading} type="button">
        {loading ? "Loading..." : children}
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="drive-create-type" className="text-xs font-medium text-gray-600">
          Create new
        </label>
        <select
          id="drive-create-type"
          value={createType}
          onChange={(event) => setCreateType(event.target.value as CreateType)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
        >
          {Object.entries(CREATE_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
        <button
          onClick={createNewFile}
          disabled={creating}
          type="button"
          className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2 rounded-md border border-gray-200 bg-white p-2">
          {selectedFiles.map((file) => {
            const size = formatSize(file.size);
            const modified = formatModifiedDate(file.modifiedTime);
            const meta = [size, modified].filter(Boolean).join(" • ");

            return (
              <div
                key={file.id}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 p-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                      {file.fileIcon || iconFromMimeType(file.mimeType)}
                    </span>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-sm text-blue-700 hover:underline"
                    >
                      {file.name}
                    </a>
                  </div>
                  <p className="truncate text-xs text-gray-500">{meta || file.mimeType}</p>
                </div>
                {file.thumbnailUrl ? (
                  <Image
                    src={file.thumbnailUrl}
                    alt={`${file.name} thumbnail`}
                    width={64}
                    height={40}
                    className="h-10 w-16 rounded border border-gray-200 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <a
                    href={file.previewUrl || file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Preview
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Type declarations for Google Picker API
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
    };
    google: {
      picker: {
        PickerBuilder: new () => {
          setOAuthToken: (
            token: string,
          ) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          setAppId: (id: string) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          addView: (view: string) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          enableFeature: (
            feature: string,
          ) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          setCallback: (
            callback: (data: { action: string; docs?: PickerDoc[] }) => void,
          ) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          build: () => { setVisible: (visible: boolean) => void };
          prototype: unknown;
        };
        ViewId: {
          DOCS: string;
          PRESENTATIONS: string;
          SPREADSHEETS: string;
        };
        Feature?: {
          MULTISELECT_ENABLED: string;
        };
      };
    };
  }
}
