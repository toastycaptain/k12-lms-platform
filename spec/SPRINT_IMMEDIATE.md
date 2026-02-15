# Immediate Priorities (This Sprint)

Items that address critical security, developer-experience, and correctness issues.

---

## 1. Investigate and remediate `master.key` exposure

**Why:** `apps/core/config/master.key` exists on disk. It is listed in `.gitignore`, but if it was ever committed before that rule existed, the key is in git history and must be considered compromised. This key decrypts `credentials.yml.enc` and all Active Record encrypted columns (e.g. `AiProviderConfig#api_key`).

**Tasks:**
1. Check whether `master.key` appears in git history:
   ```
   git log --all --diff-filter=A -- apps/core/config/master.key
   ```
2. If it was ever committed:
   - Scrub it from history (`git filter-repo --path apps/core/config/master.key --invert-paths`)
   - Generate a new master key (`rails credentials:edit` with no existing key)
   - Re-encrypt all credentials under the new key
   - Rotate any secrets that were stored in the old `credentials.yml.enc`
   - Rotate `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY`, `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY`, and `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT`
3. Confirm `.gitignore` entry `config/master.key` is present (it is — line 57) and that the file is untracked going forward.

---

## 2. Add `.env.example` files for all three services

**Why:** No `.env.example` files exist anywhere in the project. New developers have no way to know what environment variables are required without reading scattered source files.

### `apps/core/.env.example`

Document these variables (sourced from `config/database.yml`, `config/initializers/cors.rb`, `config/initializers/omniauth.rb`, `config/initializers/active_record_encryption.rb`, `config/environments/production.rb`):

```env
# Database
CORE_DATABASE_PASSWORD=
DATABASE_URL=                        # Alternative to individual DB settings

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# CORS
CORS_ORIGINS=http://localhost:3000   # Comma-separated origins

# Active Record Encryption
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=

# Rails
RAILS_MASTER_KEY=                    # Only if not using config/master.key file
RAILS_LOG_LEVEL=info
RAILS_MAX_THREADS=5

# Background Jobs
SOLID_QUEUE_IN_PUMA=true
JOB_CONCURRENCY=5
```

### `apps/ai-gateway/.env.example`

Sourced from `app/config.py` (`Settings` class fields):

```env
AI_GATEWAY_PORT=8000
AI_GATEWAY_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000

# LLM Provider Keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Auth — shared token the Rails core uses to call this service
SERVICE_TOKEN=
```

### `apps/web/.env.example`

The Next.js app likely needs at minimum:

```env
# API base URL for the Rails backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Review `apps/web/src/lib/api.ts` and any other files that reference `process.env` to capture any additional variables.

---

## 3. Harden the Dockerfile

**File:** `apps/core/Dockerfile`

**Current state** (14 lines, single-stage, runs as root, full `ruby:4.0.1` base):

```dockerfile
FROM ruby:4.0.1
RUN apt-get update -qq && apt-get install -y postgresql-client
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .
EXPOSE 3000
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

**Required changes:**

1. **Multi-stage build** — Use a `builder` stage for `bundle install`, then copy only the needed gems into a slim runtime stage.
2. **Slim base image** — Switch to `ruby:4.0.1-slim` (or `-alpine` if musl compatibility allows).
3. **Non-root user** — Create and switch to an `appuser`:
   ```dockerfile
   RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
   USER appuser
   ```
4. **HEALTHCHECK** — Add a health check pointing at the existing `/up` endpoint:
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
     CMD curl -f http://localhost:3000/up || exit 1
   ```
   (or use `wget` / a minimal health-check binary to avoid pulling in curl)
5. **Layer cleanup** — In the `apt-get` step, add `&& rm -rf /var/lib/apt/lists/*`.
6. **Explicit .dockerignore** — Ensure a `.dockerignore` exists in `apps/core/` excluding `.git`, `tmp`, `log`, `spec`, `node_modules`, `config/master.key`.

---

## 4. Pin `devise` version in Gemfile

**File:** `apps/core/Gemfile`, line 8

**Current:**
```ruby
gem "devise"
```

**Change to:**
```ruby
gem "devise", "~> 5.0"
```

This prevents `bundle update` from pulling a future Devise 6.x with breaking changes. Verify the currently locked version in `Gemfile.lock` and pin to its minor series.

Also audit the rest of the Gemfile for other un-pinned gems. Currently `omniauth`, `omniauth-google-oauth2`, `omniauth-rails_csrf_protection`, `pundit`, `sidekiq`, `active_model_serializers`, `prawn`, `prawn-table`, `faraday`, `rack-cors`, and `rack-attack` are all unpinned. At minimum, pin each to `"~> MAJOR.MINOR"` matching what's in `Gemfile.lock`.
