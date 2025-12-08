---
name: Separar API e Worker
overview: Organizar o projeto em repositórios separados para API (Next API routes) e worker, mantendo o polling via Supabase/Postgres com locks, com pacotes compartilhados e envs separados.
todos:
  - id: setup-structure
    content: Criar repos/api/worker/shared e ajustar deps
    status: pending
  - id: migrate-api
    content: Mover rotas e clientes HTTP para relatoria-api
    status: pending
  - id: migrate-worker
    content: Mover loop e AI clients para relatoria-worker
    status: pending
  - id: extract-shared
    content: Centralizar schemas/DTOs em shared
    status: pending
  - id: env-config
    content: Definir .env-dev/.homolog/.prod separados
    status: pending
  - id: docs-runbook
    content: Documentar passo a passo execução/migração
    status: pending
  - id: tests-health
    content: Adicionar healthchecks e testes básicos
    status: pending
---

# Plano para separar API e Worker

- Estrutura de repositórios
- Criar `relatoria-api/` contendo apenas API HTTP (Next API routes) e dependências mínimas.
- Criar `relatoria-worker/` contendo apenas loop de jobs e clientes AI/DB.
- Adicionar pacote compartilhado `relatoria-shared/` ou `packages/shared` (schemas AJV/DTOs, tipos de job, helpers de logging) para evitar duplicação.

- Migração de código
- Mover rotas atuais de API (`api/library`, `api/report`, etc.) para `relatoria-api/` ajustando imports para usar `shared` e clientes HTTP/DB isolados.
- Mover workers (`report_worker.js`, `parse_worker.js`, clients AI) para `relatoria-worker/`, mantendo a função de fetch com `FOR UPDATE SKIP LOCKED` (polling DB) e namespaces de log.
- Extrair contratos: schemas de `job`, `AI_OUTPUT_SCHEMA`, `business_info` para o pacote `shared`, referenciando-os tanto em API quanto worker.

- Configuração e ambientes
- Definir `.env-dev`, `.env-homolog`, `.env-prod` separados para API e worker, incluindo variáveis mínimas (Supabase URL/keys, AI provider/model, polling interval, queue table/function).
- Padronizar nomes de logs (`[API]`, `[Report Worker]`) e healthchecks (`/health` na API; heartbeat/log no worker).

- Integração com Supabase/Postgres (polling)
- Manter estratégia de polling no worker: função SQL de lock (`FOR UPDATE SKIP LOCKED`) para buscar próximo job.
- API passa a apenas criar job (status `pending`) e retorna `202 Accepted` com `job_id`; worker consome e atualiza status/resultado.

- Build e execução local
- Adicionar scripts `dev`/`start` separados para API e worker; docker-compose com dois serviços compartilhando rede e envs.
- Documentar fluxo e comandos end-to-end (criar job via API, worker processa, consultar status) com passo a passo.

- Observabilidade e testes
- Logs estruturados (json) com `job_id`, `worker_id`, `dataset_id`.
- Adicionar testes básicos: uma rota de saúde na API e um teste de integração do worker para o loop de polling.

- Documentação
- Atualizar `docs/separar-api-e-worker.md` ou novo guia com passos de migração, estrutura final de pastas, variáveis de ambiente e comandos locais (build, dev, compose).