# Domínio Calendário — arquitetura substituível

Objetivo: avançar o modelo (Recurso / Serviço / Agenda-canal) e as portas
(Google, WhatsApp, repos) **sem** acoplar a UI ao localStorage nem a um
backend específico. Directus ou API real entram só trocando adapters.

## Ideia central (conflito de tempo)

```
Recurso  = quem ocupa o tempo (pessoa / sala)
Servico  = o que é feito + duração (10min vs 2h)
Agenda   = canal (assistente / link público) → recursos + serviços
Evento   = marca recurso + serviço + horário
```

Duas “agendas” do mesmo colaborador **não** resolvem duração diferente:
o conflito é no **Recurso**. Um colaborador = um Recurso; N Serviços.

## Pastas

| Pasta | Papel |
|-------|--------|
| `domain/` | Tipos + funções puras + casos de uso |
| `ports/` | Contratos (repos, Google, notif) |
| `adapters/local/` | Implementação localStorage + stubs |
| `adapters/index.ts` | `createCalendarioServices()` |

UI atual (`store/calendarioStore`) continua no ar. Migração gradual:
chamar `casosUso` / `repos` em vez do store React.

## Google (contrato)

1. Cliente compartilha agenda com `GOOGLE_SHARE_EMAIL` (ver `defaults.ts`).
2. Cola `calendarId` na Agenda.
3. Disponibilidade só no nosso sistema.
4. Free/busy Google entra na consulta; write-through create/edit/delete;
   eventos só-Google **não** são importados.

Stub: `adapters/local/localGoogle.ts`.

## Notificações

Regras relativas (antes/depois + dias/horas/min) → jobs → `NotificacaoPort`.
0, 1 ou N regras por agenda. Stub: `localNotif.ts`.

## Trocar por Directus (depois)

1. Criar coleções espelhando `domain/models.ts`.
2. Implementar `CalendarioRepos` com SDK Directus.
3. Google/WhatsApp via Flow Directus ou n8n implementando as mesmas ports.
4. Em `adapters/index.ts`, usar os novos `create*` — **zero mudança** em
   `domain/casosUso.ts` e na UI que já consumir os services.

## O que NÃO está neste backend agora

- Parâmetros de página pública / conversa (captura de dados) — só UI.
- OAuth Google interativo (modelo é share + calendar ID).
- Provedor WhatsApp real.
