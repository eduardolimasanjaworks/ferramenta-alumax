# Agents Chatwoot — CRUD account-scoped

Auth: `api-access-token` (hífen). Base `https://chat.sanjaworks.com`

| Conta | ACC |
|-------|-----|
| Tilit | 12 |
| Minas | 13 |

```bash
export CW=https://chat.sanjaworks.com
export TOKEN='...'
export ACC=12   # ou 13
```

## Listar / criar / ver / patch / delete

```bash
curl -sS -H "api-access-token: $TOKEN" "$CW/api/v1/accounts/$ACC/agents"

curl -sS -X POST -H "api-access-token: $TOKEN" -H "Content-Type: application/json" \
  "$CW/api/v1/accounts/$ACC/agents" \
  -d '{"agent":{"name":"Nome","email":"a@x.com","role":"agent","availability":"online","auto_offline":true}}'

curl -sS -H "api-access-token: $TOKEN" "$CW/api/v1/accounts/$ACC/agents/{{user_id}}"

curl -sS -X PATCH -H "api-access-token: $TOKEN" -H "Content-Type: application/json" \
  "$CW/api/v1/accounts/$ACC/agents/{{user_id}}" \
  -d '{"agent":{"name":"Novo","role":"agent","availability":"online"}}'

curl -sS -X DELETE -H "api-access-token: $TOKEN" "$CW/api/v1/accounts/$ACC/agents/{{user_id}}"
```

Painel Tilit: modal Equipe (`POST /api/ia/usuarios` + Platform/Account sync + departamentos).
