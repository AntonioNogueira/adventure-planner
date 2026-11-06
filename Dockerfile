# Adventure Planner: builds the app and serves it (with the /api endpoints) on $PORT.
# Keys are given at runtime as environment variables, e.g.
#   docker run -p 8080:8080 -e VITE_GOOGLE_MAPS_API_KEY=... -e GEMINI_API_KEY=... adventure-planner
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["npx", "vite", "preview"]
