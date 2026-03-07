"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette as BaseCommandPalette } from "@k12/ui";
import { IB_KEYBOARD_MAP } from "@/features/ib/navigation/keyboard-map";
import { emitIbEvent } from "@/features/ib/analytics/emitIbEvent";
import type { HomeLinkItem } from "@/features/ib/home/useIbHomePayload";
import { IbSearchDialog } from "@/features/ib/search/IbSearchDialog";

export function CommandPalette({
  open,
  onClose,
  homeItems,
  recentHistory,
}: {
  open: boolean;
  onClose: () => void;
  homeItems: HomeLinkItem[];
  recentHistory: HomeLinkItem[];
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const items = useMemo(
    () => [
      ...homeItems.map((item) => ({
        id: item.id,
        label: item.label,
        group: "Action",
        keywords: [item.detail, item.href, item.programme || "IB"],
        onSelect: () => {
          void emitIbEvent({
            eventName: "ib.command.execute",
            eventFamily: "search_and_navigation",
            surface: "search",
            routeId: item.routeId,
            entityRef: item.entityRef,
            programme: item.programme,
            metadata: { href: item.href, label: item.label, detail: item.detail },
          });
          router.push(item.href);
        },
      })),
      ...recentHistory.map((item) => ({
        id: `recent-${item.id}`,
        label: `Recent • ${item.label}`,
        group: "Recent",
        keywords: [item.detail, item.href],
        onSelect: () => router.push(item.href),
      })),
      {
        id: "open-ib-search",
        label: "Open IB search",
        group: "Search",
        keywords: ["search", "documents", "stories", "evidence"],
        onSelect: () => setSearchOpen(true),
      },
      ...IB_KEYBOARD_MAP.map((shortcut) => ({
        id: `shortcut-${shortcut.combo}`,
        label: `${shortcut.label} (${shortcut.combo})`,
        group: "Keyboard",
        keywords: [shortcut.combo, shortcut.label],
        onSelect: () => onClose(),
      })),
    ],
    [homeItems, onClose, recentHistory, router],
  );

  return (
    <>
      <BaseCommandPalette open={open} title="IB command palette" items={items} onClose={onClose} />
      <IbSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
