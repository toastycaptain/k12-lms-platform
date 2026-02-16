# Frontend API Audit

## Summary
- Total API call sites audited: 405
- Total unique endpoint patterns: 263
- Endpoints with matching backend route: 405
- Endpoints requiring manual route verification: 0

## By Feature Area

### Area: addon
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/addon/classroom/page.tsx:55` | GET | `/api/v1/sync_mappings?external_id=${encodeURIComponent(externalCourseId)}&external_type=classroom_course` | - | `SyncMapping[]` | Yes |
| `apps/web/src/app/addon/classroom/page.tsx:70` | GET | `/api/v1/courses/${course.local_id}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/addon/classroom/page.tsx:71` | GET | `/api/v1/sync_mappings?local_type=Assignment` | - | `SyncMapping[]` | Yes |
| `apps/web/src/app/addon/classroom/page.tsx:94` | POST | `/api/v1/assignments/${assignment.id}/push_to_classroom` | - | - | Yes |
| `apps/web/src/app/addon/classroom/page.tsx:109` | POST | `/api/v1/assignments/${assignmentId}/sync_grades` | - | - | Yes |

### Area: admin
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/admin/ai/page.tsx:55` | GET | `/api/v1/ai_provider_configs` | - | `AiProviderConfig[]` | Yes |
| `apps/web/src/app/admin/ai/page.tsx:84` | PATCH | `/api/v1/ai_provider_configs/${form.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/ai/page.tsx:90` | POST | `/api/v1/ai_provider_configs` | JSON body | - | Yes |
| `apps/web/src/app/admin/ai/page.tsx:112` | POST | `/api/v1/ai_provider_configs/${config.id}/${action}` | - | - | Yes |
| `apps/web/src/app/admin/ai/page.tsx:127` | DELETE | `/api/v1/ai_provider_configs/${configId}` | - | - | Yes |
| `apps/web/src/app/admin/ai/policies/page.tsx:59` | GET | `/api/v1/ai_task_policies` | - | `AiTaskPolicy[]` | Yes |
| `apps/web/src/app/admin/ai/policies/page.tsx:60` | GET | `/api/v1/ai_provider_configs` | - | `AiProviderConfig[]` | Yes |
| `apps/web/src/app/admin/ai/policies/page.tsx:111` | PATCH | `/api/v1/ai_task_policies/${form.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/ai/policies/page.tsx:117` | POST | `/api/v1/ai_task_policies` | JSON body | - | Yes |
| `apps/web/src/app/admin/ai/policies/page.tsx:137` | DELETE | `/api/v1/ai_task_policies/${policyId}` | - | - | Yes |
| `apps/web/src/app/admin/ai/templates/page.tsx:63` | GET | `/api/v1/ai_templates` | - | `AiTemplate[]` | Yes |
| `apps/web/src/app/admin/ai/templates/page.tsx:100` | PATCH | `/api/v1/ai_templates/${form.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/ai/templates/page.tsx:106` | POST | `/api/v1/ai_templates` | JSON body | - | Yes |
| `apps/web/src/app/admin/ai/templates/page.tsx:126` | DELETE | `/api/v1/ai_templates/${templateId}` | - | - | Yes |
| `apps/web/src/app/admin/approvals/page.tsx:58` | GET | `/api/v1/approvals${params}` | - | `Approval[]` | Yes |
| `apps/web/src/app/admin/approvals/page.tsx:71` | POST | `/api/v1/approvals/${approvalId}/approve` | - | - | Yes |
| `apps/web/src/app/admin/approvals/page.tsx:88` | POST | `/api/v1/approvals/${approvalId}/reject` | JSON body | - | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:206` | GET | `/api/v1/academic_years/${yearId}/standards_coverage` | - | `AcademicYearCoverageResponse` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:217` | GET | `/api/v1/courses/${course.id}/standards_coverage` | - | `CourseCoverageResponse` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:252` | GET | `/api/v1/academic_years` | - | `AcademicYear[]` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:253` | GET | `/api/v1/standard_frameworks` | - | `StandardFramework[]` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:254` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:309` | GET | `/api/v1/unit_plans?course_id=${assignCourseId}` | - | `UnitPlan[]` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:382` | POST | `/api/v1/courses/${assignCourseId}/assignments` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:395` | POST | `/api/v1/assignments/${assignment.id}/standards` | JSON body | - | Yes |
| `apps/web/src/app/admin/curriculum-map/page.tsx:414` | POST | `/api/v1/unit_versions/${selectedPlan.current_version_id}/standards` | JSON body | - | Yes |
| `apps/web/src/app/admin/dashboard/page.tsx:83` | GET | `/api/v1/users` | - | `UserRow[]` | Yes |
| `apps/web/src/app/admin/dashboard/page.tsx:84` | GET | `/api/v1/courses` | - | `CourseRow[]` | Yes |
| `apps/web/src/app/admin/dashboard/page.tsx:85` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/admin/dashboard/page.tsx:86` | GET | `/api/v1/audit_logs?limit=10` | - | `AuditLogRow[]` | Yes |
| `apps/web/src/app/admin/dashboard/page.tsx:87` | GET | `/api/v1/lti_registrations` | - | `LtiRegistrationRow[]` | Yes |
| `apps/web/src/app/admin/dashboard/page.tsx:100` | GET | `/api/v1/integration_configs/${config.id}/sync_runs` | - | `SyncRun[]` | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:79` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:112` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:123` | PATCH | `/api/v1/integration_configs/${googleConfig.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:131` | POST | `/api/v1/integration_configs` | JSON body | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:158` | POST | `/api/v1/integration_configs/${googleConfig.id}/${action}` | - | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:176` | POST | `/api/v1/integration_configs/${googleConfig.id}/sync_courses` | - | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:207` | PATCH | `/api/v1/integration_configs/${oneRosterConfig.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:215` | POST | `/api/v1/integration_configs` | JSON body | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:243` | POST | `/api/v1/integration_configs/${oneRosterConfig.id}/${action}` | - | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:261` | POST | `/api/v1/integration_configs/${oneRosterConfig.id}/sync_organizations` | - | - | Yes |
| `apps/web/src/app/admin/integrations/page.tsx:280` | POST | `/api/v1/integration_configs/${oneRosterConfig.id}/sync_users` | - | - | Yes |
| `apps/web/src/app/admin/integrations/saml/page.tsx:109` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/admin/integrations/saml/page.tsx:110` | GET | `/api/v1/me` | - | `MeResponse` | Yes |
| `apps/web/src/app/admin/integrations/saml/page.tsx:178` | PATCH | `/api/v1/integration_configs/${config.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/integrations/saml/page.tsx:184` | POST | `/api/v1/integration_configs` | JSON body | `IntegrationConfig` | Yes |
| `apps/web/src/app/admin/integrations/saml/page.tsx:210` | POST | `/api/v1/integration_configs/${config.id}/${action}` | - | - | Yes |
| `apps/web/src/app/admin/integrations/sync/page.tsx:122` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/admin/integrations/sync/page.tsx:127` | GET | `/api/v1/integration_configs/${c.id}/sync_runs` | - | `SyncRun[]` | Yes |
| `apps/web/src/app/admin/integrations/sync/page.tsx:128` | GET | `/api/v1/integration_configs/${c.id}/sync_mappings` | - | `SyncMapping[]` | Yes |
| `apps/web/src/app/admin/integrations/sync/page.tsx:148` | GET | `/api/v1/sync_runs/${runId}/sync_logs` | - | `SyncLog[]` | Yes |
| `apps/web/src/app/admin/integrations/sync/page.tsx:160` | DELETE | `/api/v1/sync_mappings/${mappingId}` | - | - | Yes |
| `apps/web/src/app/admin/lti/page.tsx:91` | GET | `/api/v1/lti_registrations` | - | `LtiRegistration[]` | Yes |
| `apps/web/src/app/admin/lti/page.tsx:92` | GET | `/api/v1/courses` | - | `CourseRow[]` | Yes |
| `apps/web/src/app/admin/lti/page.tsx:129` | GET | `/api/v1/lti_registrations/${selectedRegistrationId}/lti_resource_links` | - | `LtiResourceLink[]` | Yes |
| `apps/web/src/app/admin/lti/page.tsx:142` | GET | `/api/v1/lti_registrations` | - | `LtiRegistration[]` | Yes |
| `apps/web/src/app/admin/lti/page.tsx:167` | PATCH | `/api/v1/lti_registrations/${registrationForm.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/lti/page.tsx:173` | POST | `/api/v1/lti_registrations` | JSON body | `LtiRegistration` | Yes |
| `apps/web/src/app/admin/lti/page.tsx:191` | POST | `/api/v1/lti_registrations/${id}/${action}` | - | - | Yes |
| `apps/web/src/app/admin/lti/page.tsx:206` | POST | `/api/v1/lti_registrations/${selectedRegistrationId}/lti_resource_links` | JSON body | - | Yes |
| `apps/web/src/app/admin/lti/page.tsx:221` | GET | `/api/v1/lti_registrations/${selectedRegistrationId}/lti_resource_links` | - | `LtiResourceLink[]` | Yes |
| `apps/web/src/app/admin/retention/page.tsx:43` | GET | `/api/v1/data_retention_policies` | - | `RetentionPolicy[]` | Yes |
| `apps/web/src/app/admin/retention/page.tsx:56` | GET | `/api/v1/data_retention_policies` | - | `RetentionPolicy[]` | Yes |
| `apps/web/src/app/admin/retention/page.tsx:78` | PATCH | `/api/v1/data_retention_policies/${form.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/retention/page.tsx:84` | POST | `/api/v1/data_retention_policies` | JSON body | - | Yes |
| `apps/web/src/app/admin/retention/page.tsx:100` | POST | `/api/v1/data_retention_policies/${policyId}/enforce` | - | - | Yes |
| `apps/web/src/app/admin/school/page.tsx:77` | GET | `/api/v1/schools` | - | `SchoolRow[]` | Yes |
| `apps/web/src/app/admin/school/page.tsx:78` | GET | `/api/v1/academic_years` | - | `AcademicYearRow[]` | Yes |
| `apps/web/src/app/admin/school/page.tsx:79` | GET | `/api/v1/terms` | - | `TermRow[]` | Yes |
| `apps/web/src/app/admin/school/page.tsx:111` | GET | `/api/v1/schools` | - | `SchoolRow[]` | Yes |
| `apps/web/src/app/admin/school/page.tsx:112` | GET | `/api/v1/academic_years` | - | `AcademicYearRow[]` | Yes |
| `apps/web/src/app/admin/school/page.tsx:113` | GET | `/api/v1/terms` | - | `TermRow[]` | Yes |
| `apps/web/src/app/admin/school/page.tsx:127` | PATCH | `/api/v1/schools/${schoolForm.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/school/page.tsx:139` | POST | `/api/v1/schools` | JSON body | - | Yes |
| `apps/web/src/app/admin/school/page.tsx:165` | PATCH | `/api/v1/academic_years/${yearForm.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/school/page.tsx:178` | POST | `/api/v1/academic_years` | JSON body | - | Yes |
| `apps/web/src/app/admin/school/page.tsx:207` | PATCH | `/api/v1/terms/${termForm.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/school/page.tsx:220` | POST | `/api/v1/terms` | JSON body | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:165` | GET | `/api/v1/standard_frameworks` | - | `StandardFramework[]` | Yes |
| `apps/web/src/app/admin/standards/page.tsx:170` | GET | `/api/v1/standards?standard_framework_id=${framework.id}` | - | `StandardListItem[]` | Yes |
| `apps/web/src/app/admin/standards/page.tsx:198` | GET | `/api/v1/standard_frameworks/${frameworkId}/tree` | - | `StandardTreeNode[]` | Yes |
| `apps/web/src/app/admin/standards/page.tsx:237` | POST | `/api/v1/standard_frameworks` | JSON body | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:266` | PATCH | `/api/v1/standard_frameworks/${frameworkId}` | JSON body | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:284` | DELETE | `/api/v1/standard_frameworks/${frameworkId}` | - | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:303` | POST | `/api/v1/standards` | JSON body | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:339` | PATCH | `/api/v1/standards/${standardId}` | JSON body | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:363` | DELETE | `/api/v1/standards/${standardId}` | - | - | Yes |
| `apps/web/src/app/admin/standards/page.tsx:434` | POST | `/api/v1/standards` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/admin/users/page.tsx:55` | GET | `/api/v1/users` | - | `UserRow[]` | Yes |
| `apps/web/src/app/admin/users/page.tsx:56` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/admin/users/page.tsx:94` | PATCH | `/api/v1/users/${form.id}` | JSON body | - | Yes |
| `apps/web/src/app/admin/users/page.tsx:107` | POST | `/api/v1/users` | JSON body | - | Yes |

### Area: assess
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:74` | GET | `/api/v1/quiz_attempts/${attemptId}` | - | `QuizAttempt` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:78` | GET | `/api/v1/quizzes/${attemptData.quiz_id}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:79` | GET | `/api/v1/quiz_attempts/${attemptId}/answers` | - | `AttemptAnswer[]` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:80` | GET | `/api/v1/quizzes/${attemptData.quiz_id}/results` | - | `{ attempts: AllAttempt[] }` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:93` | GET | `/api/v1/questions/${a.question_id}` | - | `Question` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:144` | POST | `/api/v1/quiz_attempts/${attemptId}/grade_all` | JSON body | - | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/grade/page.tsx:150` | GET | `/api/v1/quiz_attempts/${attemptId}` | - | `QuizAttempt` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:69` | POST | `/api/v1/quiz_attempts/${attemptId}/answers` | JSON body | - | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:85` | POST | `/api/v1/quiz_attempts/${attemptId}/submit` | - | - | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:96` | GET | `/api/v1/quiz_attempts/${attemptId}` | - | `QuizAttempt` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:105` | GET | `/api/v1/quizzes/${attemptData.quiz_id}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:106` | GET | `/api/v1/quizzes/${attemptData.quiz_id}/quiz_items` | - | `QuizItem[]` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:107` | GET | `/api/v1/quiz_attempts/${attemptId}/answers` | - | `SavedAnswer[]` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/page.tsx:118` | GET | `/api/v1/questions/${qId}` | - | `Question` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/results/page.tsx:61` | GET | `/api/v1/quiz_attempts/${attemptId}` | - | `QuizAttempt` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/results/page.tsx:65` | GET | `/api/v1/quizzes/${attemptData.quiz_id}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/results/page.tsx:66` | GET | `/api/v1/quiz_attempts/${attemptId}/answers` | - | `AttemptAnswer[]` | Yes |
| `apps/web/src/app/assess/attempts/[attemptId]/results/page.tsx:77` | GET | `/api/v1/questions/${a.question_id}` | - | `Question` | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:98` | GET | `/api/v1/question_banks/${bankId}/questions` | - | `Question[]` | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:109` | GET | `/api/v1/question_banks/${bankId}` | - | `QuestionBank` | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:129` | PATCH | `/api/v1/question_banks/${bankId}` | JSON body | `QuestionBank` | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:145` | POST | `/api/v1/question_banks/${bankId}/export_qti` | - | - | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:151` | GET | `/api/v1/question_banks/${bankId}/export_qti_status` | - | `{ status: string; download_url?: string }` | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:178` | POST | `${API_BASE}/api/v1/question_banks/${bankId}/import_qti` | JSON body | - | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:280` | PATCH | `/api/v1/questions/${editingId}` | JSON body | - | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:285` | POST | `/api/v1/question_banks/${bankId}/questions` | JSON body | - | Yes |
| `apps/web/src/app/assess/banks/[bankId]/page.tsx:302` | DELETE | `/api/v1/questions/${id}` | - | - | Yes |
| `apps/web/src/app/assess/banks/new/page.tsx:23` | POST | `/api/v1/question_banks` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/assess/banks/page.tsx:28` | GET | `/api/v1/question_banks${params}` | - | `QuestionBank[]` | Yes |
| `apps/web/src/app/assess/banks/page.tsx:46` | POST | `/api/v1/question_banks/${bankId}/export_qti` | - | - | Yes |
| `apps/web/src/app/assess/banks/page.tsx:51` | GET | `/api/v1/question_banks/${bankId}/export_qti_status` | - | `{ status: string; download_url?: string }` | Yes |
| `apps/web/src/app/assess/banks/page.tsx:74` | POST | `${API_BASE}/api/v1/question_banks/${bankId}/import_qti` | JSON body | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:98` | GET | `/api/v1/quizzes/${quizId}/quiz_items` | - | `QuizItem[]` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:108` | GET | `/api/v1/quizzes/${quizId}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:124` | GET | `/api/v1/question_banks` | - | `QuestionBank[]` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:125` | GET | `/api/v1/quizzes/${quizId}/accommodations` | - | `Accommodation[]` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:141` | PATCH | `/api/v1/quizzes/${quizId}` | JSON body | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:174` | GET | `/api/v1/question_banks/${bankId}/questions` | - | `Question[]` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:186` | POST | `/api/v1/quizzes/${quizId}/quiz_items` | JSON body | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:197` | GET | `/api/v1/quizzes/${quizId}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:204` | DELETE | `/api/v1/quiz_items/${itemId}` | - | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:206` | GET | `/api/v1/quizzes/${quizId}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:215` | PATCH | `/api/v1/quiz_items/${itemId}` | JSON body | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:220` | GET | `/api/v1/quizzes/${quizId}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:234` | POST | `/api/v1/quizzes/${quizId}/reorder_items` | JSON body | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:246` | GET | `/api/v1/quizzes/${quizId}/accommodations` | - | `Accommodation[]` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:258` | PATCH | `/api/v1/quiz_accommodations/${editingAccomId}` | JSON body | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:267` | POST | `/api/v1/quizzes/${quizId}/accommodations` | JSON body | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:301` | DELETE | `/api/v1/quiz_accommodations/${id}` | - | - | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:310` | POST | `/api/v1/quizzes/${quizId}/publish` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/page.tsx:319` | POST | `/api/v1/quizzes/${quizId}/close` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/results/page.tsx:41` | GET | `/api/v1/quizzes/${quizId}/results` | - | `QuizResult` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/take/page.tsx:41` | GET | `/api/v1/quizzes/${quizId}` | - | `Quiz` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/take/page.tsx:42` | GET | `/api/v1/quizzes/${quizId}/attempts` | - | `Attempt[]` | Yes |
| `apps/web/src/app/assess/quizzes/[quizId]/take/page.tsx:62` | POST | `/api/v1/quizzes/${quizId}/attempts` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/assess/quizzes/new/page.tsx:29` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/assess/quizzes/new/page.tsx:44` | POST | `/api/v1/courses/${courseId}/quizzes` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/assess/quizzes/page.tsx:62` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/assess/quizzes/page.tsx:68` | GET | `/api/v1/courses/${course.id}/quizzes` | - | `Quiz[]` | Yes |

### Area: communicate
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/communicate/compose/page.tsx:55` | GET | `/api/v1/users?q=${encodeURIComponent(searchQuery.trim())}` | - | `UserSearchRow[]` | Yes |
| `apps/web/src/app/communicate/compose/page.tsx:93` | POST | `/api/v1/message_threads` | JSON body | `MessageThreadResponse` | Yes |
| `apps/web/src/app/communicate/compose/page.tsx:102` | POST | `/api/v1/message_threads/${thread.id}/messages` | JSON body | - | Yes |
| `apps/web/src/app/communicate/page.tsx:99` | GET | `/api/v1/announcements` | - | `Announcement[]` | Yes |
| `apps/web/src/app/communicate/page.tsx:111` | GET | `/api/v1/message_threads` | - | `MessageThread[]` | Yes |
| `apps/web/src/app/communicate/page.tsx:130` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/communicate/page.tsx:160` | POST | `/api/v1/announcements` | JSON body | `Announcement` | Yes |
| `apps/web/src/app/communicate/threads/[threadId]/page.tsx:80` | GET | `/api/v1/message_threads/${threadId}` | - | `MessageThread` | Yes |
| `apps/web/src/app/communicate/threads/[threadId]/page.tsx:81` | GET | `/api/v1/message_threads/${threadId}/messages` | - | `Message[]` | Yes |
| `apps/web/src/app/communicate/threads/[threadId]/page.tsx:112` | POST | `/api/v1/message_threads/${threadId}/messages` | JSON body | `Message` | Yes |

### Area: components
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/components/AiAssistantPanel.tsx:50` | GET | `/api/v1/ai_task_policies` | - | `AiTaskPolicy[]` | Yes |
| `apps/web/src/components/AiAssistantPanel.tsx:100` | POST | `/api/v1/ai_invocations` | JSON body | `InvocationResponse` | Yes |
| `apps/web/src/components/AiAssistantPanel.tsx:128` | GET | `/api/v1/ai/stream` | - | - | Yes |
| `apps/web/src/components/GlobalSearch.tsx:72` | GET | `/api/v1/search?q=${encodeURIComponent(trimmedQuery)}` | - | `SearchResponse` | Yes |
| `apps/web/src/components/GoogleDrivePicker.tsx:24` | GET | `/api/v1/drive/picker_token` | - | `{ access_token: string; expires_in: number }` | Yes |
| `apps/web/src/components/NotificationBell.tsx:30` | GET | `/api/v1/notifications/unread_count` | - | `{ count: number }` | Yes |
| `apps/web/src/components/NotificationBell.tsx:40` | GET | `/api/v1/notifications` | - | `Notification[]` | Yes |
| `apps/web/src/components/NotificationBell.tsx:100` | PATCH | `/api/v1/notifications/${notificationId}/read` | - | - | Yes |
| `apps/web/src/components/NotificationBell.tsx:117` | POST | `/api/v1/notifications/mark_all_read` | - | - | Yes |
| `apps/web/src/components/SchoolSelector.tsx:21` | GET | `/api/v1/schools` | - | `School[]` | Yes |

### Area: dashboard
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/dashboard/page.tsx:51` | GET | `/api/v1/unit_plans` | - | `UnitPlan[]` | Yes |
| `apps/web/src/app/dashboard/page.tsx:52` | GET | `/api/v1/courses` | - | `Course[]` | Yes |

### Area: learn
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:158` | GET | `/api/v1/assignments/${assignmentId}` | - | `Assignment` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:159` | GET | `/api/v1/assignments/${assignmentId}/resource_links` | - | `ResourceLink[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:160` | GET | `/api/v1/assignments/${assignmentId}/standards` | - | `Standard[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:161` | GET | `/api/v1/assignments/${assignmentId}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:173` | GET | `/api/v1/rubrics/${assignmentData.rubric_id}` | - | `Rubric` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:180` | GET | `/api/v1/submissions/${latestSubmission.id}/rubric_scores` | - | `RubricScore[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:221` | POST | `/api/v1/assignments/${assignment.id}/submissions` | JSON body | `Submission` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/assignments/[assignmentId]/page.tsx:227` | POST | `/api/v1/assignments/${assignment.id}/submissions` | JSON body | `Submission` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/discussions/[discussionId]/page.tsx:183` | GET | `/api/v1/discussions/${discussionId}` | - | `Discussion` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/discussions/[discussionId]/page.tsx:184` | GET | `/api/v1/discussions/${discussionId}/posts` | - | `DiscussionPost[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/discussions/[discussionId]/page.tsx:185` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/discussions/[discussionId]/page.tsx:213` | POST | `/api/v1/discussions/${discussionId}/posts` | JSON body | - | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:159` | GET | `/api/v1/courses/${courseId}` | - | `Course` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:160` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:161` | GET | `/api/v1/terms` | - | `Term[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:162` | GET | `/api/v1/courses/${courseId}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:163` | GET | `/api/v1/courses/${courseId}/quizzes` | - | `Quiz[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:164` | GET | `/api/v1/courses/${courseId}/discussions` | - | `{ id: number; title: string }[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:187` | GET | `/api/v1/enrollments?section_id=${section.id}` | - | `Enrollment[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:209` | GET | `/api/v1/assignments/${assignment.id}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:220` | GET | `/api/v1/quizzes/${quiz.id}/attempts` | - | `QuizAttempt[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:236` | GET | `/api/v1/discussions/${discussion.id}/posts` | - | `DiscussionPost[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:249` | GET | `/api/v1/courses/${courseId}/course_modules` | - | `CourseModule[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:262` | GET | `/api/v1/modules/${moduleEntry.id}/module_items` | - | `ModuleItem[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:263` | GET | `/api/v1/course_modules/${moduleEntry.id}/progress` | - | `ModuleProgressResponse` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/page.tsx:354` | GET | `/api/v1/module_items/${moduleItemId}/complete` | - | - | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:156` | GET | `/api/v1/quizzes/${attempt.quiz_id}/quiz_items` | - | `QuizItem[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:157` | GET | `/api/v1/quiz_attempts/${attempt.id}/answers` | - | `AttemptAnswer[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:165` | GET | `/api/v1/questions/${item.question_id}` | - | `Question` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:196` | GET | `/api/v1/quizzes/${quizId}` | - | `Quiz` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:197` | GET | `/api/v1/quizzes/${quizId}/attempts` | - | `QuizAttempt[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:205` | GET | `/api/v1/quizzes/${quizId}/accommodations` | - | `QuizAccommodation[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:245` | POST | `/api/v1/quiz_attempts/${activeAttempt.id}/answers` | JSON body | - | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:307` | POST | `/api/v1/quizzes/${quiz.id}/attempts` | JSON body | `QuizAttempt` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/attempt/page.tsx:340` | POST | `/api/v1/quiz_attempts/${activeAttempt.id}/submit` | - | `QuizAttempt` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:177` | GET | `/api/v1/quiz_attempts/${attemptId}` | - | `QuizAttempt` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:179` | GET | `/api/v1/quizzes/${attemptData.quiz_id}` | - | `Quiz` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:180` | GET | `/api/v1/quiz_attempts/${attemptId}/answers` | - | `AttemptAnswer[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:181` | GET | `/api/v1/quizzes/${attemptData.quiz_id}/attempts` | - | `QuizAttempt[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:182` | GET | `/api/v1/quizzes/${attemptData.quiz_id}/quiz_items` | - | `QuizItem[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:197` | GET | `/api/v1/quizzes/${attemptData.quiz_id}/accommodations` | - | `QuizAccommodation[]` | Yes |
| `apps/web/src/app/learn/courses/[courseId]/quizzes/[quizId]/results/[attemptId]/page.tsx:209` | GET | `/api/v1/questions/${entry.question_id}` | - | `Question` | Yes |
| `apps/web/src/app/learn/courses/page.tsx:68` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/learn/courses/page.tsx:69` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/learn/courses/page.tsx:70` | GET | `/api/v1/terms` | - | `Term[]` | Yes |
| `apps/web/src/app/learn/courses/page.tsx:88` | GET | `/api/v1/enrollments?section_id=${section.id}` | - | `Enrollment[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:142` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:143` | GET | `/api/v1/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:144` | GET | `/api/v1/submissions?status=graded` | - | `Submission[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:145` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:162` | GET | `/api/v1/enrollments?section_id=${section.id}` | - | `Enrollment[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:172` | GET | `/api/v1/courses/${course.id}/course_modules` | - | `CourseModule[]` | Yes |
| `apps/web/src/app/learn/dashboard/page.tsx:181` | GET | `/api/v1/course_modules/${moduleEntry.id}/progress` | - | `ModuleProgressResponse` | Yes |
| `apps/web/src/app/learn/grades/page.tsx:109` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/learn/grades/page.tsx:110` | GET | `/api/v1/terms` | - | `Term[]` | Yes |
| `apps/web/src/app/learn/grades/page.tsx:111` | GET | `/api/v1/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/learn/grades/page.tsx:112` | GET | `/api/v1/submissions` | - | `Submission[]` | Yes |

### Area: lib
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/lib/api-poll.ts:17` | GET | `/api/v1/ai_invocations/${invocationId}` | - | `InvocationResponse` | Yes |
| `apps/web/src/lib/api.ts:130` | GET | `/api/v1/me` | - | `MeResponse` | Yes |

### Area: lti
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/lti/deep-link/page.tsx:75` | GET | `/api/v1/courses` | - | `CourseRow[]` | Yes |
| `apps/web/src/app/lti/deep-link/page.tsx:97` | GET | `/api/v1/assignments?course_id=${selectedCourseId}` | - | `AssignmentRow[]` | Yes |
| `apps/web/src/app/lti/deep-link/page.tsx:98` | GET | `/api/v1/courses/${selectedCourseId}/quizzes` | - | `QuizRow[]` | Yes |
| `apps/web/src/app/lti/deep-link/page.tsx:139` | POST | `/api/v1/lti/deep_link_response` | JSON body | `DeepLinkResponse` | Yes |
| `apps/web/src/app/lti/launch/[linkId]/page.tsx:30` | GET | `/api/v1/lti_resource_links/${linkId}` | - | `LtiResourceLink` | Yes |

### Area: notifications
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/notifications/page.tsx:45` | GET | `/api/v1/notifications?${params.toString()}` | - | `Notification[]` | Yes |
| `apps/web/src/app/notifications/page.tsx:67` | PATCH | `/api/v1/notifications/${notificationId}/read` | - | - | Yes |

### Area: plan
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/plan/calendar/page.tsx:107` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/plan/calendar/page.tsx:108` | GET | `/api/v1/unit_plans${query}` | - | `UnitPlan[]` | Yes |
| `apps/web/src/app/plan/calendar/page.tsx:109` | GET | `/api/v1/assignments${query}` | - | `Assignment[]` | Yes |
| `apps/web/src/app/plan/standards/page.tsx:128` | GET | `/api/v1/standard_frameworks` | - | `StandardFramework[]` | Yes |
| `apps/web/src/app/plan/standards/page.tsx:147` | GET | `/api/v1/standard_frameworks/${selectedFramework}/tree` | - | `StandardTree[]` | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:79` | GET | `/api/v1/templates/${templateId}` | - | `Template` | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:80` | GET | `/api/v1/templates/${templateId}/versions` | - | `TemplateVersion[]` | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:81` | GET | `/api/v1/standards` | - | `Standard[]` | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:105` | GET | `/api/v1/template_versions/${cv.id}/standards` | - | `Standard[]` | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:128` | PATCH | `/api/v1/templates/${templateId}` | JSON body | - | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:141` | POST | `/api/v1/templates/${templateId}/create_version` | JSON body | `TemplateVersion` | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:162` | POST | `/api/v1/template_versions/${newVersion.id}/standards` | JSON body | - | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:182` | POST | `/api/v1/templates/${templateId}/publish` | - | - | Yes |
| `apps/web/src/app/plan/templates/[id]/page.tsx:194` | POST | `/api/v1/templates/${templateId}/archive` | - | - | Yes |
| `apps/web/src/app/plan/templates/[id]/use/page.tsx:46` | GET | `/api/v1/templates/${templateId}` | - | `Template` | Yes |
| `apps/web/src/app/plan/templates/[id]/use/page.tsx:47` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/plan/templates/[id]/use/page.tsx:73` | POST | `/api/v1/templates/${templateId}/create_unit` | JSON body | `UnitPlan` | Yes |
| `apps/web/src/app/plan/templates/new/page.tsx:31` | POST | `/api/v1/templates` | JSON body | `Template` | Yes |
| `apps/web/src/app/plan/templates/page.tsx:51` | GET | `/api/v1/templates` | - | `Template[]` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:66` | GET | `/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}` | - | `LessonPlan` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:71` | GET | `/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/versions` | - | `LessonVersion[]` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:86` | GET | `/api/v1/lesson_versions/${cv.id}/resource_links` | - | `ResourceLink[]` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:110` | POST | `/api/v1/unit_plans/${unitId}/lesson_plans/${lessonId}/create_version` | JSON body | - | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:133` | POST | `/api/v1/lesson_versions/${currentVersion.id}/resource_links` | JSON body | - | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:154` | DELETE | `/api/v1/lesson_versions/${currentVersion.id}/resource_links/${resourceId}` | - | - | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:346` | POST | `/api/v1/drive/documents` | JSON body | `{ id: string; title: string; url: string }` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:370` | POST | `/api/v1/drive/presentations` | JSON body | `{ id: string; title: string; url: string }` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/[lessonId]/page.tsx:394` | POST | `/api/v1/lesson_versions/${currentVersion.id}/resource_links` | JSON body | - | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/new/page.tsx:42` | GET | `/api/v1/unit_plans/${unitId}` | - | `UnitPlan` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/new/page.tsx:43` | GET | `/api/v1/unit_plans/${unitId}/lesson_plans` | - | `LessonPlan[]` | Yes |
| `apps/web/src/app/plan/units/[id]/lessons/new/page.tsx:76` | POST | `/api/v1/unit_plans/${unitId}/lesson_plans` | JSON body | `CreatedLesson` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:92` | GET | `/api/v1/unit_plans/${unitId}` | - | `UnitPlan` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:93` | GET | `/api/v1/unit_plans/${unitId}/versions` | - | `UnitVersion[]` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:94` | GET | `/api/v1/unit_plans/${unitId}/lesson_plans` | - | `LessonPlan[]` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:95` | GET | `/api/v1/standard_frameworks` | - | `StandardFramework[]` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:117` | GET | `/api/v1/standards` | - | `Standard[]` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:123` | GET | `/api/v1/unit_versions/${vers[0].id}/standards` | - | `Standard[]` | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:145` | POST | `/api/v1/unit_plans/${unitId}/create_version` | JSON body | - | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:167` | POST | `/api/v1/unit_plans/${unitId}/publish` | - | - | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:406` | POST | `/api/v1/unit_versions/${currentVersion.id}/standards` | JSON body | - | Yes |
| `apps/web/src/app/plan/units/[id]/page.tsx:439` | DELETE | `/api/v1/unit_versions/${currentVersion.id}/standards/bulk_destroy` | JSON body | - | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:111` | GET | `/api/v1/unit_plans/${unitId}` | - | `UnitPlan` | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:112` | GET | `/api/v1/unit_plans/${unitId}/versions` | - | `UnitVersion[]` | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:113` | GET | `/api/v1/unit_plans/${unitId}/lesson_plans` | - | `LessonPlan[]` | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:127` | GET | `/api/v1/unit_plans/${unitId}/lesson_plans/${lesson.id}/versions` | - | `LessonVersion[]` | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:132` | GET | `/api/v1/lesson_versions/${latestVersion.id}/resource_links` | - | `ResourceLink[]` | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:177` | POST | `/api/v1/unit_plans/${unitId}/publish` | - | - | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:193` | POST | `/api/v1/unit_plans/${unitId}/export_pdf` | - | - | Yes |
| `apps/web/src/app/plan/units/[id]/preview/page.tsx:198` | GET | `/api/v1/unit_plans/${unitId}/export_pdf_status` | - | `ExportStatusResponse` | Yes |
| `apps/web/src/app/plan/units/new/page.tsx:30` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/plan/units/new/page.tsx:55` | POST | `/api/v1/unit_plans` | JSON body | `UnitPlan` | Yes |
| `apps/web/src/app/plan/units/page.tsx:63` | GET | `/api/v1/unit_plans?page=${page}&per_page=${perPage}` | - | `UnitPlan[]` | Yes |
| `apps/web/src/app/plan/units/page.tsx:64` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/plan/units/page.tsx:75` | GET | `/api/v1/unit_plans/${unit.id}/versions` | - | `UnitVersion[]` | Yes |

### Area: report
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/report/page.tsx:147` | GET | `/api/v1/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/report/page.tsx:155` | GET | `/api/v1/courses/${course.id}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/report/page.tsx:162` | GET | `/api/v1/quizzes` | - | `Quiz[]` | Yes |
| `apps/web/src/app/report/page.tsx:170` | GET | `/api/v1/courses/${course.id}/quizzes` | - | `Quiz[]` | Yes |
| `apps/web/src/app/report/page.tsx:177` | GET | `/api/v1/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/report/page.tsx:186` | GET | `/api/v1/assignments/${assignment.id}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/report/page.tsx:195` | GET | `/api/v1/courses/${course.id}/quiz_performance` | - | `CourseQuizPerformance` | Yes |
| `apps/web/src/app/report/page.tsx:257` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/report/page.tsx:268` | GET | `/api/v1/users?role=student` | - | `User[]` | Yes |
| `apps/web/src/app/report/standards-coverage/page.tsx:110` | GET | `/api/v1/academic_years` | - | `AcademicYear[]` | Yes |
| `apps/web/src/app/report/standards-coverage/page.tsx:111` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/report/standards-coverage/page.tsx:143` | GET | `/api/v1/academic_years/${yearId}/standards_coverage` | - | `AcademicYearCoverageResponse` | Yes |
| `apps/web/src/app/report/standards-coverage/page.tsx:168` | GET | `/api/v1/courses/${courseId}/standards_coverage` | - | `CourseCoverageResponse` | Yes |

### Area: setup
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/setup/page.tsx:56` | PATCH | `/api/v1/me` | JSON body | - | Yes |

### Area: teach
| File | Method | Endpoint | Request Body | Expected Response Shape | Route Exists? |
|------|--------|----------|--------------|-------------------------|---------------|
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:125` | GET | `/api/v1/submissions/${submissionId}` | - | `Submission` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:126` | GET | `/api/v1/assignments/${assignmentId}` | - | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:127` | GET | `/api/v1/assignments/${assignmentId}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:128` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:156` | GET | `/api/v1/rubrics/${assignmentData.rubric_id}` | - | `Rubric` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:157` | GET | `/api/v1/submissions/${submissionId}/rubric_scores` | - | `RubricScoreResponse[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/grade/[submissionId]/page.tsx:231` | PATCH | `/api/v1/submissions/${submission.id}` | JSON body | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:188` | GET | `/api/v1/assignments/${assignmentId}` | - | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:189` | GET | `/api/v1/rubrics` | - | `RubricSummary[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:190` | GET | `/api/v1/standards` | - | `Standard[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:191` | GET | `/api/v1/assignments/${assignmentId}/resource_links` | - | `ResourceLink[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:222` | GET | `/api/v1/unit_plans?course_id=${courseId}` | - | `UnitPlan[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:228` | GET | `/api/v1/unit_plans/${unitPlan.id}/versions` | - | `UnitVersion[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:249` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:253` | GET | `/api/v1/integration_configs/${integrationConfigs[0].id}/sync_mappings` | - | `SyncMapping[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:300` | PATCH | `/api/v1/assignments/${assignment.id}` | JSON body | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:322` | DELETE | `/api/v1/assignments/${assignment.id}/standards/bulk_destroy` | JSON body | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:328` | POST | `/api/v1/assignments/${assignment.id}/standards` | JSON body | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:350` | POST | `/api/v1/assignments/${assignment.id}/publish` | - | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:369` | POST | `/api/v1/assignments/${assignment.id}/close` | - | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:385` | PATCH | `/api/v1/assignments/${assignment.id}` | JSON body | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:401` | POST | `/api/v1/rubrics` | JSON body | `RubricSummary` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:422` | POST | `/api/v1/assignments/${assignment.id}/resource_links` | JSON body | `ResourceLink` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:452` | POST | `/api/v1/assignments/${assignment.id}/resource_links` | JSON body | `ResourceLink` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:477` | DELETE | `/api/v1/assignments/${assignment.id}/resource_links/${resourceId}` | - | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/page.tsx:492` | POST | `/api/v1/assignments/${assignment.id}/push_to_classroom` | - | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/submit/page.tsx:77` | GET | `/api/v1/assignments/${assignmentId}` | - | `Assignment` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/submit/page.tsx:81` | GET | `/api/v1/rubrics/${assignmentData.rubric_id}` | - | `Rubric` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/submit/page.tsx:87` | GET | `/api/v1/assignments/${assignmentId}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/[assignmentId]/submit/page.tsx:110` | POST | `/api/v1/assignments/${assignmentId}/submissions` | JSON body | `Submission` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/assignments/new/page.tsx:25` | POST | `/api/v1/courses/${courseId}/assignments` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx:201` | GET | `/api/v1/discussions/${discussionId}` | - | `Discussion` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx:202` | GET | `/api/v1/discussions/${discussionId}/posts` | - | `DiscussionPost[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx:203` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx:240` | POST | `/api/v1/discussions/${discussionId}/posts` | JSON body | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/[discussionId]/page.tsx:268` | POST | `/api/v1/discussions/${discussionId}/${nextLocked ? "lock" : "unlock"}` | - | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/page.tsx:59` | GET | `/api/v1/courses/${courseId}/discussions` | - | `Discussion[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/page.tsx:69` | GET | `/api/v1/discussions/${discussion.id}/posts` | - | `{ id: number }[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/discussions/page.tsx:95` | POST | `/api/v1/courses/${courseId}/discussions` | JSON body | `Discussion` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx:46` | GET | `/api/v1/courses/${courseId}/gradebook` | - | `GradebookRow[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx:47` | GET | `/api/v1/courses/${courseId}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/gradebook/page.tsx:48` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:149` | GET | `/api/v1/modules/${moduleId}` | - | `CourseModule` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:150` | GET | `/api/v1/modules/${moduleId}/module_items` | - | `ModuleItem[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:151` | GET | `/api/v1/courses/${courseId}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:152` | GET | `/api/v1/courses/${courseId}/quizzes` | - | `Quiz[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:153` | GET | `/api/v1/courses/${courseId}/discussions` | - | `Discussion[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:179` | PATCH | `/api/v1/modules/${moduleId}` | JSON body | `CourseModule` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:196` | POST | `/api/v1/modules/${moduleId}/publish` | - | `CourseModule` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:211` | PATCH | `/api/v1/course_modules/${moduleId}/reorder` | JSON body | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:243` | DELETE | `/api/v1/module_items/${itemId}` | - | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:257` | POST | `/api/v1/modules/${moduleId}/module_items` | JSON body | `ModuleItem` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:279` | POST | `/api/v1/modules/${moduleId}/module_items` | JSON body | `ModuleItem` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/[moduleId]/page.tsx:340` | PATCH | `/api/v1/module_items/${item.id}` | JSON body | `ModuleItem` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/modules/new/page.tsx:22` | POST | `/api/v1/courses/${courseId}/modules` | JSON body | `{ id: number }` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:163` | GET | `/api/v1/courses/${courseId}` | - | `Course` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:164` | GET | `/api/v1/courses/${courseId}/modules` | - | `CourseModule[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:165` | GET | `/api/v1/courses/${courseId}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:166` | GET | `/api/v1/courses/${courseId}/discussions` | - | `Discussion[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:167` | GET | `/api/v1/terms` | - | `Term[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:168` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:188` | GET | `/api/v1/enrollments?section_id=${section.id}` | - | `Enrollment[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:202` | GET | `/api/v1/modules/${moduleEntry.id}/module_items` | - | `ModuleItem[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:234` | GET | `/api/v1/assignments/${assignment.id}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:239` | GET | `/api/v1/discussions/${discussion.id}/posts` | - | `DiscussionPost[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:272` | GET | `/api/v1/integration_configs` | - | `IntegrationConfig[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:277` | GET | `/api/v1/integration_configs/${activeConfig.id}/sync_mappings?local_type=Course` | - | `SyncMapping[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:327` | POST | `/api/v1/sync_mappings/${courseMapping.id}/sync_roster` | - | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/page.tsx:329` | POST | `/api/v1/integration_configs/${integrationConfig.id}/sync_courses` | - | - | Yes |
| `apps/web/src/app/teach/courses/[courseId]/quiz-performance/page.tsx:80` | GET | `/api/v1/courses/${courseId}/quiz_performance` | - | `CourseQuizPerformance` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/quizzes/[quizId]/analytics/page.tsx:116` | GET | `/api/v1/quizzes/${quizId}/analytics` | - | `QuizAnalytics` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/roster/page.tsx:47` | GET | `/api/v1/courses/${courseId}` | - | `Course` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/roster/page.tsx:48` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/roster/page.tsx:61` | GET | `/api/v1/enrollments?section_id=${section.id}` | - | `Enrollment[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/submissions/page.tsx:87` | GET | `/api/v1/courses/${courseId}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/submissions/page.tsx:88` | GET | `/api/v1/users` | - | `User[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/submissions/page.tsx:99` | GET | `/api/v1/assignments/${assignment.id}/submissions` | - | `Submission[]` | Yes |
| `apps/web/src/app/teach/courses/[courseId]/submissions/page.tsx:235` | PATCH | `/api/v1/submissions/${row.id}` | JSON body | - | Yes |
| `apps/web/src/app/teach/courses/page.tsx:42` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/teach/courses/page.tsx:43` | GET | `/api/v1/sections` | - | `Section[]` | Yes |
| `apps/web/src/app/teach/courses/page.tsx:44` | GET | `/api/v1/enrollments` | - | `Enrollment[]` | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:82` | GET | `/api/v1/submissions/${submissionId}` | - | `Submission` | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:87` | GET | `/api/v1/assignments/${sub.assignment_id}` | - | `Assignment` | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:91` | GET | `/api/v1/rubrics/${asn.rubric_id}` | - | `Rubric` | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:96` | GET | `/api/v1/submissions/${submissionId}/rubric_scores` | - | `{ rubric_criterion_id: number; rubric_rating_id: number \| null; points_awarded: string; comments: string }[]` | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:158` | POST | `/api/v1/submissions/${submissionId}/rubric_scores` | JSON body | - | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:164` | POST | `/api/v1/submissions/${submissionId}/grade` | JSON body | - | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:181` | POST | `/api/v1/submissions/${submissionId}/grade` | JSON body | - | Yes |
| `apps/web/src/app/teach/submissions/[submissionId]/grade/page.tsx:195` | POST | `/api/v1/submissions/${submissionId}/return` | - | - | Yes |
| `apps/web/src/app/teach/submissions/page.tsx:71` | GET | `/api/v1/courses` | - | `Course[]` | Yes |
| `apps/web/src/app/teach/submissions/page.tsx:78` | GET | `/api/v1/courses/${course.id}/assignments` | - | `Assignment[]` | Yes |
| `apps/web/src/app/teach/submissions/page.tsx:84` | GET | `/api/v1/assignments/${assignment.id}/submissions` | - | `Submission[]` | Yes |

