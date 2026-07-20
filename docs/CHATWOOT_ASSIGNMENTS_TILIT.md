# Assignments Chatwoot — Tilit (account 12)

Endpoint único:

`POST /api/v1/accounts/12/conversations/{{display_id}}/assignments`

Auth: header `api-access-token` (hífen). Base: `https://chat.sanjaworks.com`

IDs departamento (team): 7 atendimento · 8 financeiro · 9 comercial · 10 correspondência · 11 impressão · 12 reservas · 13 fornecedores · 14 dr paulo ladeira · 15 marketing · 16 RH · 17 tela de atendimento

`display_id` = número da conversa na UI.

## Transferir departamento (só team)

```bash
curl -sS -X POST \
  -H "api-access-token: $TOKEN" \
  -H "Content-Type: application/json" \
  "https://chat.sanjaworks.com/api/v1/accounts/12/conversations/123/assignments" \
  -d '{"team_id": 8}'
```

## Transferência padrão

```bash
curl -sS -X POST \
  -H "api-access-token: $TOKEN" \
  -H "Content-Type: application/json" \
  "https://chat.sanjaworks.com/api/v1/accounts/12/conversations/123/assignments" \
  -d '{
    "team_id": 9,
    "department_transfer": true,
    "transfer_mode": "handoff_new_conversation",
    "transfer_note": "Cliente pediu proposta"
  }'
```

## Manter histórico

```bash
curl -sS -X POST \
  -H "api-access-token: $TOKEN" \
  -H "Content-Type: application/json" \
  "https://chat.sanjaworks.com/api/v1/accounts/12/conversations/123/assignments" \
  -d '{
    "team_id": 9,
    "department_transfer": true,
    "transfer_mode": "keep_thread"
  }'
```

## Atribuir agent

```bash
curl -sS -X POST \
  -H "api-access-token: $TOKEN" \
  -H "Content-Type: application/json" \
  "https://chat.sanjaworks.com/api/v1/accounts/12/conversations/123/assignments" \
  -d '{"assignee_id": 44}'
```

Código app: `app/src/chatwoot-assignments.ts` + tool `transferir_humano` (param `departamento`) em `agente-minasplaca.ts`.
