# alumax — instancia IA (clone do Tilit)

Instancia isolada por cliente: codigo proprio nesta pasta, banco `alumax`
no tilit_postgres, Redis DB 8, collection Qdrant `alumax_conhecimento`.
Infra (postgres/redis/qdrant/directus) compartilhada com o Tilit.

- URL: https://alumax.ia.sanjaworks.com (local: http://IP:8116)
- Master (licenca IA): https://ia.sanjaworks.com/admin
- Subir: `docker compose up -d --build`
- Licenca de IA: painel-master-ti, instance_name `alumax-principal`
- Prompt do cliente: edite `prompt-cliente.txt` e reinicie o app
- Pendencias ao ativar: DNS do dominio, instancia Evolution real, conta Chatwoot no .env
- Clonar outro cliente: pelo Master (botao Clonar app) ou `scripts/clonar-instancia.sh`
