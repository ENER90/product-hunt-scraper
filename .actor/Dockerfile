FROM apify/actor-node-playwright-firefox:22 AS builder
COPY --chown=myuser package*.json ./
RUN npm install --include=dev --audit=false --ignore-scripts
COPY --chown=myuser . ./
RUN npm run build
FROM apify/actor-node-playwright-firefox:22
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
USER myuser
ENV CAMOUFOX_INSTALL_DIR=/home/myuser/camoufox
COPY --chown=myuser package*.json ./
RUN npm --quiet set progress=false && npm install --omit=dev --audit=false && env -u PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD npx camoufox-js fetch && ls /home/myuser/camoufox
COPY --from=builder --chown=myuser /home/myuser/dist ./dist
COPY --chown=myuser . ./
CMD npm run start --silent
