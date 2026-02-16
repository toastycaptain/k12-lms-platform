"use client";

import { useEffect, useState } from "react";

export function LiveRegion() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setMessage(customEvent.detail || "");

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        setMessage("");
      }, 1000);
    };

    window.addEventListener("sr-announce", handler as EventListener);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener("sr-announce", handler as EventListener);
    };
  }, []);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function announce(message: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent("sr-announce", { detail: message }));
}
