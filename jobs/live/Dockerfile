FROM node:24.19.0-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43
ENV NODE_ENV=production
WORKDIR /app
COPY .cache/live/ /app/
USER 10001:10001
CMD ["node", "/app/main.mjs"]
