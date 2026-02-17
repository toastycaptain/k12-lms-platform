import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

export interface Notification {
  id: number;
  title?: string;
  message?: string;
  body?: string;
  event_type?: string;
  read_at?: string | null;
  created_at?: string;
}

export interface NotificationPreference {
  event_type: string;
  in_app_enabled?: boolean;
  email_enabled?: boolean;
  sms_enabled?: boolean;
}

export interface UseNotificationsParams {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}

export function useNotifications(
  params: UseNotificationsParams = {},
  config?: SWRConfiguration<Notification[]>,
) {
  const query = buildQueryString(params);
  return useAppSWR<Notification[]>(`/api/v1/notifications${query}`, config);
}

export function useNotificationPreferences(config?: SWRConfiguration<NotificationPreference[]>) {
  return useAppSWR<NotificationPreference[]>("/api/v1/notification_preferences", config);
}
