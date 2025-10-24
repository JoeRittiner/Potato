# Stage 1: build the TypeScript
FROM node:22-slim AS builder

WORKDIR /app

COPY ear/discord_chat/package*.json ear/discord_chat/tsconfig.json ./

# Install all dependencies (including dev for tsc)
RUN npm ci

COPY ear/discord_chat/src ./src

# Compile to JS
RUN npm run build

# Stage 3: run the application
FROM node:22-slim AS runtime

WORKDIR /app

COPY ear/discord_chat/package*.json ./
RUN npm ci --omit=dev

# Copy compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# Run the bot
CMD ["node", "dist/index.js"]