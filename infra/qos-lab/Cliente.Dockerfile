FROM laplacita-qos-backend:test
USER root
COPY backend/scripts/medir-carga.js /app/medir-carga.js
ENTRYPOINT ["sh", "-c", "while :; do sleep 3600; done"]
