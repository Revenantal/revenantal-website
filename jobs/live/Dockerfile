FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5
ENV NODE_ENV=production
WORKDIR /app
COPY .cache/live/ /app/
# A new named volume mounted here takes this owner, so the job can write live.json.
RUN mkdir /data && chown 10001:10001 /data
USER 10001:10001
CMD ["node", "/app/main.mjs"]
