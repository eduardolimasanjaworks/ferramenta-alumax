FROM node:20-bookworm-slim AS crm-build
WORKDIR /crm
COPY vendor/crm-techfala/package.json vendor/crm-techfala/package-lock.json* ./
RUN npm install
COPY vendor/crm-techfala/ ./
RUN npm run build

FROM node:20-bookworm-slim AS cal-build
WORKDIR /cal
COPY vendor/techfala-calendario/package.json vendor/techfala-calendario/package-lock.json* ./
RUN npm install
COPY vendor/techfala-calendario/ ./
RUN npm run build

FROM node:20-bookworm-slim AS camp-build
WORKDIR /camp
COPY vendor/tilit-campanhas/package.json vendor/tilit-campanhas/package-lock.json* ./
RUN npm install
COPY vendor/tilit-campanhas/ ./
RUN npm run build

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY public ./public
COPY --from=crm-build /crm/dist ./public/crm
COPY --from=cal-build /cal/dist ./public/calendario
COPY --from=camp-build /camp/dist ./public/campanhas
EXPOSE 8096
CMD ["node", "dist/index.js"]
