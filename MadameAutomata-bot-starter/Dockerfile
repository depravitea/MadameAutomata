FROM node:20-alpine

WORKDIR /app

# Install ALL deps (including dev) so tsc exists
COPY package*.json ./
ENV npm_config_loglevel=warn
RUN npm install --production=false

# Copy the rest and build
COPY . .
RUN npm run build

# Runtime
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
