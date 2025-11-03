# 📝 Histórico Completo de Commits

**Total:** 47 commits  
**Período:** 01/11/2025 15:19 - 03/11/2025 01:18

---

## 01 de Novembro de 2025

### Setup Inicial
- `25b21a7` (15:19) - chore: configuração inicial do backend
- `ab978d0` (15:25) - refactor(database): migrar de asyncpg para psycopg3
- `83c58c7` (15:46) - refactor: migração completa para psycopg3
- `e780eb7` (15:57) - feat: docker-compose para gerador de dados
- `336933a` (16:02) - fix: unicode encoding no docker

### Frontend Inicial
- `6c745c7` (18:32) - feat: frontend inicial com React + Vite
- `16ae93b` (19:01) - feat: materialized views + ambiente completo
- `09e2f13` (20:03) - feat: gráficos ECharts completos
- `2889c84` (20:09) - refactor: limpeza e READMEs

### Filtros e Documentação
- `5010474` (20:18) - fix: estrutura de filtros (array → objeto)
- `44a73b7` (21:16) - docs: análise de status vs SPECKIT
- `76336d7` (21:23) - docs: plano de melhorias
- `7a1a376` (21:36) - feat: filtros globais (Feature #1)

### Correções Backend
- `ab60d81` (22:05) - fix: psycopg-pool no requirements
- `aa77674` (22:11) - docs: QUICKSTART.md
- `f0ac04e` (22:37) - fix: parâmetros SQL none
- `21125f2` (23:18) - fix: placeholders SQL (parte 1)
- `80e081d` (23:20) - fix: placeholders SQL completo
- `566e8e7` (23:35) - fix: event loop Windows
- `66d1fb9` (23:37) - feat: métricas opcionais
- `b883e82` (23:39) - fix: formato order_by
- `c886f32` (23:42) - feat: aliases PT-BR
- `3f4d4b2` (23:43) - feat: métricas SQL customizadas
- `d681504` (23:45) - fix: nome coluna quantity
- `2651ff8` (23:47) - feat: ajuste range de datas
- `b3fd757` (23:51) - feat: comparação de períodos (backend)

---

## 02 de Novembro de 2025

### Features Principais
- `bdff6d6` (20:24) - feat: comparação de períodos (frontend) - Feature #2
- `b054c43` (20:30) - feat: gráfico temporal - Feature #3
- `5ace57b` (20:36) - feat: eixos Y duplos
- `64a9b8f` (20:39) - feat: melhorias gráfico temporal
- `8a1e484` (20:42) - feat: tabela dinâmica - Feature #4
- `876115a` (20:47) - fix: simplificação DataTable
- `b2a55f2` (20:52) - feat: query builder - Feature #5
- `7ae4a26` (20:57) - feat: segurança SQL injection
- `ee95c41` (21:19) - refactor: remover query builder
- `be0c8b1` (21:21) - feat: export completo - Feature #6

### Melhorias e Ajustes
- `b61de9a` (21:27) - feat: DataTable error handling
- `e8aef67` (21:34) - fix: nomes de dimensões
- `a6a1865` (21:52) - feat: validação métricas customizadas
- `5b7cc5e` (21:56) - feat: pattern 4 COUNT DISTINCT

### Churn Dashboard
- `c05f7cb` (22:02) - feat: churn dashboard - Feature #7
- `5c04008` (22:03) - fix: imports churn
- `5f3942c` (22:49) - fix: queries de churn
- `c3f3e3a` (23:03) - feat: ajuste clientes em risco

### Features Avançadas
- `b0634ec` (23:09) - feat: salvar dashboards - Feature #8
- `adfe267` (23:25) - feat: dark mode - Feature #10
- `e9aa56b` (23:36) - feat: drill-down - Feature #9

### Drill-down Bugfixes (11 commits)
- `89be313` (23:44) - fix: imports drill-down
- `3a848e3` (23:45) - fix: remover monetaryMetrics
- `93c5103` (23:45) - fix: remover useDashboardStore
- `b146795` (23:48) - fix: filtros array vs string
- `ae53fd4` (23:56) - fix: backend filter mapping

---

## 03 de Novembro de 2025

### Drill-down Finalização
- `1fa4c4f` (00:10) - fix: cache React Query
- `31967f8` (00:17) - debug: logs gráficos
- `1d51bbc` (00:30) - fix: cleanup gráficos
- `fcc91ea` (00:40) - fix: retry mechanism refs
- `20a3060` (00:56) - fix: destroyOnClose modal

### Features Finais
- `094ee15` (01:05) - feat: sistema de alertas - Feature #11
- `4fb75b3` (01:09) - fix: imports alertas
- `e6fa6e0` (01:18) - feat: internacionalização i18n - Feature #12

---

## 📊 Estatísticas por Tipo

| Tipo | Quantidade | Porcentagem |
|------|-----------|-------------|
| feat (Features) | 22 | 47% |
| fix (Bugfixes) | 18 | 38% |
| refactor | 4 | 9% |
| docs | 2 | 4% |
| debug | 1 | 2% |

---

## 📈 Commits por Hora

| Hora | Commits | Principais Atividades |
|------|---------|----------------------|
| 15h-16h | 5 | Setup inicial, Docker |
| 18h-20h | 4 | Frontend, Gráficos |
| 20h-22h | 10 | Features, Tabelas |
| 22h-00h | 13 | Churn, Dark Mode, Drill-down |
| 00h-02h | 15 | Bugfixes Drill-down, Alertas, i18n |

---

## 🏆 Maiores Commits

1. `094ee15` - Sistema de Alertas (938 insertions)
2. `e6fa6e0` - i18n (530 insertions)
3. `c05f7cb` - Churn Dashboard (450+ insertions)
4. `09e2f13` - Gráficos ECharts (400+ insertions)
5. `e9aa56b` - Drill-down (350+ insertions)

---

## 👤 Desenvolvedor

**Nome:** Vinicius Oliveira  
**Email:** vinicius.oliveiratwt@gmail.com  
**Data:** 03 de novembro de 2025

> 💡 **Nota:** Documentação revisada e aprovada pelo desenvolvedor.

---

**Última Atualização:** 03/11/2025

---

**Desenvolvido por Vinicius Oliveira** · vinicius.oliveiratwt@gmail.com
