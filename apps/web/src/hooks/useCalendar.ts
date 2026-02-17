import { type SWRConfiguration } from "swr";
import { buildQueryString, useAppSWR } from "@/lib/swr";

export interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  course_id?: number | null;
  course_name?: string | null;
  status?: string | null;
  url?: string | null;
}

export interface CalendarResponse {
  events: CalendarEvent[];
}

export interface UseCalendarParams {
  start_date?: string;
  end_date?: string;
  course_id?: number;
}

export function useCalendar(
  params: UseCalendarParams = {},
  config?: SWRConfiguration<CalendarResponse>,
) {
  const query = buildQueryString(params);
  return useAppSWR<CalendarResponse>(`/api/v1/calendar${query}`, config);
}
