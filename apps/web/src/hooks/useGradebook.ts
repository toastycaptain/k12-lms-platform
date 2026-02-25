import { type SWRConfiguration } from "swr";
import { useAppSWR } from "@/lib/swr";

export interface GradeCell {
  assignment_id: number;
  assignment_title: string;
  assignment_type: string;
  grade_category_id: number | null;
  grade_category_name: string | null;
  submission_id: number | null;
  grade: number | null;
  points_possible: number | null;
  percentage: number | null;
  status: string;
  submitted: boolean;
  late: boolean;
  missing: boolean;
  due_at: string | null;
  submitted_at: string | null;
}

export interface QuizGradeCell {
  quiz_id: number;
  title: string;
  attempt_id: number | null;
  score: number | null;
  points_possible: number | null;
  percentage: number | null;
  status: string;
  submitted_at: string | null;
}

export interface MasterySummary {
  threshold: number;
  mastered_standards: number;
  total_standards: number;
  percentage: number | null;
}

export interface StudentRow {
  id: number;
  name: string;
  email: string;
  grades: GradeCell[];
  quiz_grades: QuizGradeCell[];
  course_average: number | null;
  missing_count: number;
  late_count: number;
  mastery: MasterySummary | null;
}

export interface AssignmentSummary {
  id: number;
  title: string;
  due_at: string | null;
  points_possible: number | null;
  submission_count: number;
  graded_count: number;
  average: number | null;
  median: number | null;
}

export interface QuizSummary {
  id: number;
  title: string;
  points_possible: number | null;
}

export interface CourseSummary {
  student_count: number;
  assignment_count: number;
  quiz_count: number;
  overall_average: number | null;
  grade_distribution: Record<string, number>;
  assignment_completion_rate: number;
  students_with_missing_work: number;
  category_averages: Record<string, number | null>;
}

export interface GradebookResponse {
  students: StudentRow[];
  assignments: AssignmentSummary[];
  quizzes: QuizSummary[];
  course_summary: CourseSummary;
  mastery_threshold: number;
  grade_categories: Array<{
    id: number;
    name: string;
    weight_percentage: number;
  }>;
}

export function useGradebook(
  courseId: string | number | null | undefined,
  config?: SWRConfiguration<GradebookResponse>,
) {
  return useAppSWR<GradebookResponse>(
    courseId ? `/api/v1/courses/${courseId}/gradebook` : null,
    config,
  );
}
