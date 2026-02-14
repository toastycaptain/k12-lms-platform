# Web App (`apps/web`)

Next.js frontend for planning, teaching, assessment, and admin workflows.

## Prerequisites

- Node.js 20+

## Setup

```bash
npm ci
```

## Local Development

```bash
npm run dev
```

Set API host if needed:

```bash
export NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
npm run ci
```

Notes:
- `typecheck` clears stale `.next` artifacts before generating route types to avoid false negatives.
