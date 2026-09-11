# Microsoft's official Playwright image — includes Chromium plus every system
# library it needs (glib, nss, at-spi, etc.). This avoids the missing-shared-library
# errors that happen with Railway's default Node build environment.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# App code
COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
