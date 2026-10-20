FROM node:24.22.0-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f
ENV NODE_ENV=production
WORKDIR /app
COPY .cache/live/ /app/
# A new named volume mounted here takes this owner, so the job can write live.json.
RUN mkdir /data && chown 10001:10001 /data
USER 10001:10001
CMD ["node", "/app/main.mjs"]
