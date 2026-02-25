"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/performance";

export default function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
