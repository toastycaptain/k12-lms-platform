import { GENERIC_NAV_ITEMS } from "@/features/curriculum/navigation/registry";
import type { NavigationChildItem, NavigationItem } from "@/features/curriculum/navigation/types";

export type NavItemId = string;
export type NavChildItem = NavigationChildItem;
export type NavRegistryItem = NavigationItem;

export const NAV_REGISTRY: NavRegistryItem[] = GENERIC_NAV_ITEMS;
export const DEFAULT_NAV_ORDER: NavItemId[] = GENERIC_NAV_ITEMS.map((item) => item.id);
