FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53
ENV NODE_ENV=production
WORKDIR /app
COPY .cache/live/ /app/
# A new named volume mounted here takes this owner, so the job can write live.json.
RUN mkdir /data && chown 10001:10001 /data
USER 10001:10001
CMD ["node", "/app/main.mjs"]
