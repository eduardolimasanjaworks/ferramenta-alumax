# TechFala CRM (frontend)

Kanban CRM em React — **sem dependências de UI externas**.

A sidebar de módulos placeholder (Assistente, Multi Chat, etc.) foi removida.
Neste repo o app monta só o CRM; a navegação entre módulos fica no **painel hospedeiro** (Minas / Tilit).

## Dependências

- `react` / `react-dom`
- Vite + TypeScript

## Como rodar (standalone)

```bash
cd crm-techfala
npm install
npm run dev
```

Build para embed (`base: /crm/`):

```bash
npm run build
# saída em dist/ → servir em /crm/
```

## Embed nas apps (submodule)

Nas ferramentas Minas/Tilit o CRM vive em `app/vendor/crm-techfala` (git submodule / clone do mesmo repo).

### Editar o CRM

```bash
cd crm-techfala   # ou app/vendor/crm-techfala
# ... alterações ...
git add -A && git commit -m "..."
git push origin main
```

### Trazer para uma app (quando quiser “mergear”)

```bash
cd ferramenta-minasplaca   # ou ferramenta-tilit
git submodule update --remote app/vendor/crm-techfala
# se for clone aninhado sem submodule:
#   cd app/vendor/crm-techfala && git pull origin main
git add app/vendor/crm-techfala
git commit -m "chore: bump crm-techfala"
docker compose up -d --build app
```

## Estrutura

```
src/
  app/           → App (só CrmPage)
  features/crm/  → Kanban, contato, tarefas, campos
  features/shell → legado (não usado no App)
  shared/        → ícones, tipos, storage
  styles/        → CSS puro
```
