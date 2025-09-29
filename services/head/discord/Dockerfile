FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests first
COPY package*.json ./

# Install only production deps
# (drop --only=production if deploy-commands.js needs dev deps)
RUN npm ci --only=production

# Copy app source
COPY . .

# Default command (start bot)
CMD ["npm", "run", "start"]