# ---------- Stage 1: build ----------
FROM node:26-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Huella del código que entra a la imagen: /api/v1/health la devuelve y el
# workflow de despliegue la compara con la del commit (scripts/huella.mjs).
RUN node scripts/huella.mjs > huella.txt
RUN npm run build

# ---------- Stage 2: run ----------
FROM node:26-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# El contrato lo sirve /api/v1/openapi con fs en runtime; el build standalone
# no incluye archivos que nadie importa, hay que copiarlo explícitamente.
COPY --from=build --chown=node:node /app/openapi.yaml ./openapi.yaml
COPY --from=build --chown=node:node /app/huella.txt ./huella.txt
EXPOSE 3000
ENV PORT=3000
# S13: el servidor corre con el usuario sin privilegios `node` de la imagen,
# no como root; si alguien lograra ejecutar código, no controla el contenedor.
USER node
CMD ["node", "server.js"]