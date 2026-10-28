FROM caddy:2.11.7-alpine@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f

# The upstream binary carries cap_net_bind_service, which cannot exec under
# cap-drop ALL with no-new-privileges. Port 8080 needs no capability; a plain
# copy drops it.
RUN cp /usr/bin/caddy /tmp/caddy && mv /tmp/caddy /usr/bin/caddy

ENV XDG_CONFIG_HOME=/tmp/caddy/config XDG_DATA_HOME=/tmp/caddy/data
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY dist/ /srv/site/
# The live-data volume's mount point, owned like the job's, whichever container starts first.
RUN mkdir -p /srv/revenantal-live && chown 10001:10001 /srv/revenantal-live
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
