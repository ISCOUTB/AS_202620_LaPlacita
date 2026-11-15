FROM laplacita-qos-backend:base
USER root
RUN apk add --no-cache iproute2
USER node
