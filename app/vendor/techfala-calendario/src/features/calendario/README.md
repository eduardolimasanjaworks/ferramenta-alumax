# features/calendario/

Aba Calendário do TechFala (grade, lista, eventos e agendas).

## UI (atual)

- `CalendarioPage.tsx` — sidebar + toolbar + vistas + modais
- `components/` — vistas, sheets e config
- `store/` — agendas/eventos legados (`techfala-calendario-v1`)

## Domínio / backend-ready

Ver [`domain/README.md`](./domain/README.md).

- `domain/` — Recurso, Serviço, Agenda-canal, conflitos, casos de uso
- `ports/` / `adapters/` — contratos + localStorage
- `lib/bridgeAgenda.ts` — ponte UI ↔ domínio
- Store sincroniza recursos/serviços e espelha no adapter
- `EventoSheet` — Serviço + conflito no Recurso
- `NotificacaoSheet` / `SecaoServicos` / Google “Testar conexão”
