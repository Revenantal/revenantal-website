FROM node:24.22.2-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85
ENV NODE_ENV=production
WORKDIR /app
COPY .cache/live/ /app/
# A new named volume mounted here takes this owner, so the job can write live.json.
RUN mkdir /data && chown 10001:10001 /data
USER 10001:10001
CMD ["node", "/app/main.mjs"]
