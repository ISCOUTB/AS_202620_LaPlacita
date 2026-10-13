# ---------- Stage 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage 2: run ----------
FROM node:22-alpine
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# El server standalone escucha en localhost dentro del contenedor (igual que
# le pasó al backend en su primer despliegue): 0.0.0.0 lo expone al proxy.
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# El manifest, el service worker y los íconos viven en public/: el build
# standalone NO los copia — hay que hacerlo explícitamente.
COPY --from=build /app/public ./public
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
