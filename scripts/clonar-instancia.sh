#!/usr/bin/env bash
# Por que existe: clona a ferramenta Tilit para um novo cliente com CÓDIGO e DADOS
# isolados (pasta, imagem Docker, banco PG, Redis DB, collection Qdrant próprios),
# compartilhando a infra existente (tilit_postgres/redis/qdrant/directus).
# Uso: ./clonar-instancia.sh <slug> <porta> <redis_db> <dominio> [nome_banco]
# Ex.:  ./clonar-instancia.sh sanjafree 8110 2 sanjafree.ia.sanjaworks.com
# HOST_ROOT: raiz do servidor (/root no host, /host/root no container master).

set -euo pipefail

SLUG="${1:?informe o slug (ex.: sanjafree)}"
PORTA="${2:?informe a porta (ex.: 8110)}"
REDIS_DB="${3:?informe o indice do Redis (ex.: 2)}"
DOMINIO="${4:?informe o dominio (ex.: sanjafree.ia.sanjaworks.com)}"
NOME_BANCO="${5:-$SLUG}"
HOST_ROOT="${HOST_ROOT:-/root}"

ORIGEM="${HOST_ROOT}/tilit-rag/ferramenta-tilit"
DESTINO="${HOST_ROOT}/${SLUG}-rag/ferramenta-${SLUG}"

if [[ ! -d "$ORIGEM" ]]; then
  echo "ERRO: origem nao encontrada: $ORIGEM (HOST_ROOT=$HOST_ROOT)" >&2
  exit 1
fi

if [[ -d "$DESTINO" ]]; then
  echo "ERRO: $DESTINO ja existe. Remova ou escolha outro slug." >&2
  exit 1
fi

# Segredos reaproveitados do .env base (mesmas chaves de LLM/Evolution/Directus)
pegar_env() { grep -m1 "^${1}=" "$ORIGEM/.env" | cut -d'=' -f2- ; }
OPENROUTER_TOKEN="$(pegar_env OPENROUTER_TOKEN)"
OPENAI_API_KEY="$(pegar_env OPENAI_API_KEY)"
EVOLUTION_URL="$(pegar_env EVOLUTION_URL)"
EVOLUTION_API_KEY="$(pegar_env EVOLUTION_API_KEY)"
DIRECTUS_TOKEN="$(pegar_env DIRECTUS_TOKEN)"
LICENCA_URL="$(pegar_env LICENCA_IA_DATABASE_URL)"

echo "==> Copiando codigo de $ORIGEM para $DESTINO (sem node_modules/dist)"
mkdir -p "$DESTINO"
rsync -a \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.git/' \
  --exclude 'data/crm-arquivos/' \
  --exclude 'TechFala*' \
  --exclude '.env' \
  --exclude 'docker-compose.yml' \
  "$ORIGEM/" "$DESTINO/"
mkdir -p "$DESTINO/data/crm-arquivos"
chmod 777 "$DESTINO/data/crm-arquivos"

echo "==> Gerando .env"
cat > "$DESTINO/.env" <<EOF
# ${SLUG} — instancia clonada do Tilit (infra compartilhada, dados isolados).
# Banco: ${NOME_BANCO} @ tilit_postgres | Redis DB ${REDIS_DB} | Qdrant ${SLUG}_conhecimento
# Gerado por scripts/clonar-instancia.sh — ajuste Evolution/Chatwoot ao ativar o cliente.

# Identidade publica (CORS, HTTP-Referer, webhooks)
PUBLIC_URL=https://${DOMINIO}

# LLM (mesmas chaves da base Tilit)
OPENROUTER_TOKEN=${OPENROUTER_TOKEN}
MODELO_CHAT_OPENROUTER=openai/gpt-4o-mini
OPENROUTER_HABILITADO=true
OPENAI_API_KEY=${OPENAI_API_KEY}

# WhatsApp / Evolution externa — crie a instancia real e ajuste os nomes abaixo
EVOLUTION_URL=${EVOLUTION_URL}
EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
EVOLUTION_INSTANCE=${SLUG}-principal
EVOLUTION_INSTANCES=${SLUG}-principal
LICENCA_INSTANCE_PRINCIPAL=${SLUG}-principal
LICENCA_IA_DATABASE_URL=${LICENCA_URL}
IAGMX_WEBHOOK_EVOLUTION_URL=https://${DOMINIO}/webhook/evolution

# UazAPI — vazio ate o cliente contratar linha propria
UAZAPI_BASE_URL=
UAZAPI_ADMIN_TOKEN=
UAZAPI_TOKEN=
UAZAPI_INSTANCE_NAME=
UAZAPI_WEBHOOK_URL=https://${DOMINIO}/webhook/uazapi

# Dados isolados na infra compartilhada
DATABASE_URL=postgresql://tilit:tilit_secret_2026@tilit_postgres:5432/${NOME_BANCO}
REDIS_URL=redis://tilit_redis:6379/${REDIS_DB}
QDRANT_URL=http://tilit_qdrant:6333
QDRANT_COLLECTION=${SLUG}_conhecimento

# Directus compartilhado (so upload/download de arquivos)
DIRECTUS_URL=http://tilit_directus:8055
DIRECTUS_TOKEN=${DIRECTUS_TOKEN}
VITE_DIRECTUS_TOKEN=${DIRECTUS_TOKEN}

# Admin do painel desta instancia
IAMINASPLACA_ADMIN_KEY=${SLUG}-pausa-2026
TILIT_WEBHOOK_KEY=${SLUG}-pausa-2026
IAMINASPLACA_ADMIN_EMAIL=admin@${SLUG}.local
IAMINASPLACA_ADMIN_PASSWORD=${SLUG}-admin-2026

# Comportamento
DEBOUNCE_MS=10000
CALENDARIO_HABILITADO=false
PORT=${PORTA}

# Chatwoot — preencher ao ativar o cliente (conta propria no chat.sanjaworks.com)
CHATWOOT_URL=https://chat.sanjaworks.com
CHATWOOT_ACCOUNT_ID=
CHATWOOT_ACCOUNT_NAME=${SLUG}
CHATWOOT_SSO_USER_ID=
CHATWOOT_PLATFORM_TOKEN=
EOF

echo "==> Gerando docker-compose.yml"
cat > "$DESTINO/docker-compose.yml" <<EOF
# ${SLUG} — sobe SO o app; postgres/redis/qdrant/directus sao os containers
# tilit_* compartilhados (rede gmx_net). Traefik publica em https://${DOMINIO}.
# Gerado por scripts/clonar-instancia.sh.

networks:
  gmx_net:
    external: true
    name: gmx_net
  n8n_edge:
    external: true
    name: n8n_edge

services:
  app:
    build: ./app
    container_name: ${SLUG}_app
    networks: [gmx_net, n8n_edge]
    restart: unless-stopped
    labels:
      - traefik.enable=true
      - traefik.docker.network=n8n_edge
      - traefik.http.routers.${SLUG}.rule=Host(\`${DOMINIO}\`)
      - traefik.http.routers.${SLUG}.entrypoints=websecure
      - traefik.http.routers.${SLUG}.tls.certresolver=le
      - traefik.http.routers.${SLUG}.service=${SLUG}
      - traefik.http.services.${SLUG}.loadbalancer.server.port=${PORTA}
    ports:
      - '0.0.0.0:${PORTA}:${PORTA}'
    env_file:
      - .env
    volumes:
      - ./.env:/app/.env:ro
      - ./prompt-cliente.txt:/app/prompt-cliente.txt:ro
      - ./data:/app/data:ro
      - ./data/crm-arquivos:/app/data/crm-arquivos
EOF

echo "==> Gerando README.md"
cat > "$DESTINO/README.md" <<EOF
# ${SLUG} — instancia IA (clone do Tilit)

Instancia isolada por cliente: codigo proprio nesta pasta, banco \`${NOME_BANCO}\`
no tilit_postgres, Redis DB ${REDIS_DB}, collection Qdrant \`${SLUG}_conhecimento\`.
Infra (postgres/redis/qdrant/directus) compartilhada com o Tilit.

- URL: https://${DOMINIO} (local: http://IP:${PORTA})
- Master (licenca IA): https://ia.sanjaworks.com/admin
- Subir: \`docker compose up -d --build\`
- Licenca de IA: painel-master-ti, instance_name \`${SLUG}-principal\`
- Prompt do cliente: edite \`prompt-cliente.txt\` e reinicie o app
- Pendencias ao ativar: DNS do dominio, instancia Evolution real, conta Chatwoot no .env
- Clonar outro cliente: pelo Master (botao Clonar app) ou \`scripts/clonar-instancia.sh\`
EOF

mkdir -p "$DESTINO/scripts"
cp -f "$ORIGEM/scripts/clonar-instancia.sh" "$DESTINO/scripts/clonar-instancia.sh" 2>/dev/null || true

echo "==> Pronto: $DESTINO"
echo "    1. Banco: docker exec tilit_postgres psql -U tilit -c 'CREATE DATABASE ${NOME_BANCO} OWNER tilit;'"
echo "    2. Suba: cd $DESTINO && docker compose up -d --build"
echo "    3. Licenca: https://ia.sanjaworks.com/admin (ou ja criada pelo Master)"
