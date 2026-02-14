"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

interface GoogleDrivePickerProps {
  onSelect: (file: DriveFile) => void;
  children: React.ReactNode;
}

export default function GoogleDrivePicker({ onSelect, children }: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);

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
      const picker = new window.google.picker.PickerBuilder()
        .setOAuthToken(tokenData.access_token)
        .setAppId(clientId)
        .addView(window.google.picker.ViewId.DOCS)
        .addView(window.google.picker.ViewId.PRESENTATIONS)
        .addView(window.google.picker.ViewId.SPREADSHEETS)
        .setCallback((data: { action: string; docs?: Array<{ id: string; name: string; mimeType: string; url: string }> }) => {
          if (data.action === "picked" && data.docs?.[0]) {
            const doc = data.docs[0];
            onSelect({
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url,
            });
          }
        })
        .build();
      picker.setVisible(true);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  return (
    <button onClick={openPicker} disabled={loading} type="button">
      {loading ? "Loading..." : children}
    </button>
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
          setOAuthToken: (token: string) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          setAppId: (id: string) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          addView: (view: string) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          setCallback: (callback: (data: { action: string; docs?: Array<{ id: string; name: string; mimeType: string; url: string }> }) => void) => Window["google"]["picker"]["PickerBuilder"]["prototype"];
          build: () => { setVisible: (visible: boolean) => void };
          prototype: unknown;
        };
        ViewId: {
          DOCS: string;
          PRESENTATIONS: string;
          SPREADSHEETS: string;
        };
      };
    };
  }
}
