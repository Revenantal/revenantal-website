FROM node:24.19.0-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43
RUN apk add --no-cache openssh-client rsync
ENV NODE_ENV=production
WORKDIR /app
COPY .cache/pelican/ /app/
COPY dist/site.json /app/site.json
USER 10001:10001
CMD ["node", "/app/main.mjs"]
