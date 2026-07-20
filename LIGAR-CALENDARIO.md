# Ligar Calendário (iatilit)

Por padrão o Calendário fica **desligado** (`CALENDARIO_HABILITADO=false`).

## Como religar

1. No `.env` (e no `docker-compose.yml` se a env estiver inline):

```bash
CALENDARIO_HABILITADO=true
```

2. Rebuild / restart:

```bash
docker compose up -d app --build
```

3. Hard refresh no navegador (Ctrl+Shift+R).

O item **Calendário** só aparece no menu se `/api/ui-flags` retornar `calendario: true`.
