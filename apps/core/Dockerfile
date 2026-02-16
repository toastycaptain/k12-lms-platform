# --- Builder ---
FROM ruby:4.0.1 AS builder
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev libyaml-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3
COPY . .

# --- Runtime ---
FROM ruby:4.0.1-slim AS runtime
RUN apt-get update -qq && apt-get install -y libpq5 libyaml-0-2 curl && rm -rf /var/lib/apt/lists/*
RUN groupadd --system appgroup && useradd --system --create-home --gid appgroup appuser
WORKDIR /app
COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app
RUN mkdir -p /app/log /app/tmp && chown -R appuser:appgroup /app/log /app/tmp
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s CMD curl -f http://localhost:${PORT:-8080}/up || exit 1
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
