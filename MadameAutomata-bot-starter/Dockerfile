FROM node:20-alpine

WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm ci || npm install

# Copy the rest
COPY . .

# Build TypeScript
RUN npm run build

# Environment & port for Railway healthcheck
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start your bot
CMD ["node", "dist/index.js"]
