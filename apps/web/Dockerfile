FROM node:22-alpine

WORKDIR /app

# Copy the local @k12/ui package and install its dependencies
COPY packages/ui ./packages/ui
WORKDIR /app/packages/ui
RUN npm install --legacy-peer-deps

# Copy the web app and install its dependencies
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN npm install --legacy-peer-deps

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
