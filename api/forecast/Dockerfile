FROM node:24.22.0-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f
ENV NODE_ENV=production PORT=8090 DBIP_PATH=/app/dbip-city-lite.mmdb
WORKDIR /app
# The bundled service, plus the DB-IP database when tools/build/fetch-dbip.ts has fetched it.
# Without the database the service starts and answers every forecast as unavailable.
COPY .cache/forecast/ /app/
USER 10001:10001
EXPOSE 8090
CMD ["node", "/app/main.mjs"]
