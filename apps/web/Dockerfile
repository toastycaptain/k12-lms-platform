FROM node:22-alpine

WORKDIR /app

# Copy everything from build context
COPY . .

# Install @k12/ui dependencies if the package exists at monorepo level
RUN if [ -d "packages/ui" ]; then cd packages/ui && npm install --legacy-peer-deps; fi

# Install web app dependencies - handle both monorepo and single-app context
RUN if [ -d "apps/web" ]; then cd apps/web && npm install --legacy-peer-deps; else npm install --legacy-peer-deps; fi

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build from the correct directory
RUN if [ -d "apps/web" ]; then cd apps/web && npm run build; else npm run build; fi

EXPOSE 3000

# Start from the correct directory
CMD if [ -d "apps/web" ]; then cd apps/web && npm run start; else npm run start; fi
