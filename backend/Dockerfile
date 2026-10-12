# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- Stage 2: run ----------
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# El contrato lo sirve /api/v1/openapi con fs en runtime; el build standalone
# no incluye archivos que nadie importa, hay que copiarlo explícitamente.
COPY --from=build /app/openapi.yaml ./openapi.yaml
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]