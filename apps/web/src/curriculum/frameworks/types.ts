export interface Framework {
  id: number;
  key?: string | null;
  name: string;
  framework_kind: string;
  subject?: string | null;
  jurisdiction?: string | null;
  version?: string | null;
  status?: string;
}

export interface FrameworkNode {
  id: number;
  standard_framework_id: number;
  kind: string;
  code?: string | null;
  identifier?: string | null;
  label?: string | null;
  description?: string;
  grade_band?: string | null;
}

export interface FrameworkNodeTree extends FrameworkNode {
  children: FrameworkNodeTree[];
}

export interface UseFrameworkParams {
  framework_kind?: string;
  status?: string;
}

export interface UseFrameworkNodeSearchParams {
  q?: string;
  standard_framework_id?: number;
  kind?: string;
  page?: number;
  per_page?: number;
}
