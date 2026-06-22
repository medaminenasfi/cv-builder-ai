FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    nodejs \
    libgraphite2-3 \
    libfontconfig1 \
    libfreetype6 \
    libpng16-16 \
    libharfbuzz0b \
    && rm -rf /var/lib/apt/lists/*

ARG TECTONIC_VERSION=0.15.0
RUN curl -fsSL "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-gnu.tar.gz" \
    | tar -xz -C /usr/local/bin

ENV TECTONIC_CACHE_DIR=/var/cache/tectonic

RUN useradd -r -u 1001 -m sandbox \
    && mkdir -p /var/cache/tectonic \
    && chown sandbox:sandbox /var/cache/tectonic

WORKDIR /app

COPY warmup.tex ./
RUN mkdir -p /tmp/warmup-out \
    && HOME=/var/cache/tectonic XDG_CACHE_HOME=/var/cache/tectonic \
       tectonic -X compile warmup.tex --outdir /tmp/warmup-out \
    && chown -R sandbox:sandbox /var/cache/tectonic \
    && rm -rf /tmp/warmup-out

COPY server.js package.json ./

USER sandbox

EXPOSE 8081

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8081/health || exit 1

CMD ["node", "server.js"]
