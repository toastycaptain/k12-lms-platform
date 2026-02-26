FROM node:22-alpine

WORKDIR /app

# Copy the local @k12/ui package
COPY packages/ui ./packages/ui

# Copy the web app
COPY apps/web ./apps/web

WORKDIR /app/apps/web
RUN npm install --legacy-peer-deps

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
