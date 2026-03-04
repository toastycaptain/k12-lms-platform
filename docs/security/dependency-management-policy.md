# Dependency Management and Vulnerability Remediation Policy

## Scope
This policy applies to backend/API services in this repository:
- `apps/core` (Ruby on Rails)
- `apps/ai-gateway` (FastAPI)

## Approved Package Sources
- Ruby gems must resolve from RubyGems via `Gemfile.lock`.
- Python packages must resolve from PyPI via `pyproject.toml` and CI installs.
- Direct URL dependencies are not allowed without documented security exception approval.

## Vulnerability Remediation SLAs
- Critical (CVSS 9.0-10.0): patch and deploy within 24 hours.
- High (CVSS 7.0-8.9): patch and deploy within 7 calendar days.
- Medium (CVSS 4.0-6.9): patch and deploy within 30 calendar days.
- Low (CVSS <4.0): patch in the next scheduled dependency maintenance cycle (max 90 days).

If no upstream patch exists, engineering must document compensating controls and an exception review in the incident/security log.

## Required CI Controls
- `bundler-audit` for Ruby gems.
- `pip-audit` for Python dependencies.
- SBOM/inventory generation for both backend services each CI run.

## Rotation and Ownership
- Dependency ownership: platform/backend maintainers.
- Weekly review of dependency scan output and unresolved exceptions.
- Monthly refresh of lockfiles and dependency inventory artifacts.

## SBOM Generation
- Run `scripts/generate_sbom.sh` to generate backend dependency inventory artifacts.
- CI uploads generated SBOM artifacts for every build.
