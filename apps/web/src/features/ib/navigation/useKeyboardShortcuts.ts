"use client";

import { useEffect } from "react";

export function useKeyboardShortcuts(
  handlers: Partial<
    Record<"openPalette" | "home" | "evidence" | "publishing" | "review", () => void>
  >,
) {
  useEffect(() => {
    let chordPrefix = "";

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handlers.openPalette?.();
        return;
      }

      if (event.key.toLowerCase() === "g") {
        chordPrefix = "g";
        window.setTimeout(() => {
          chordPrefix = "";
        }, 800);
        return;
      }

      if (chordPrefix !== "g") {
        return;
      }

      const next = event.key.toLowerCase();
      chordPrefix = "";
      if (next === "h") handlers.home?.();
      if (next === "e") handlers.evidence?.();
      if (next === "p") handlers.publishing?.();
      if (next === "r") handlers.review?.();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
