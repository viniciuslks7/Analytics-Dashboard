# 🔒 Guia de Segurança - Query Builder

## Visão Geral

O Query Builder foi projetado com **segurança em primeiro lugar** para prevenir vulnerabilidades comuns em aplicações analytics.

## ✅ Medidas de Segurança Implementadas

### 1. **Whitelist de Métricas e Dimensões**

**Problema:** Permitir SQL arbitrário abre porta para SQL Injection
**Solução:** Apenas métricas e dimensões pré-definidas são aceitas

```python
# Backend valida contra whitelist
allowed_metrics = set(analytics_service.METRICS_MAP.keys())
allowed_dimensions = set(analytics_service.DIMENSIONS_MAP.keys())
```

### 2. **Validação de Métricas Customizadas**

**Problema:** Usuários podem tentar injetar SQL em métricas personalizadas
**Solução:** Regex rigorosa valida padrão seguro

```python
# Apenas permite: FUNCTION(table.column) as alias
pattern = r'^(SUM|AVG|COUNT|MIN|MAX)\([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\)\s+as\s+[a-zA-Z_][a-zA-Z0-9_]*$'
```

**Exemplos aceitos:**
- ✅ `SUM(ps.quantity) as total_vendido`
- ✅ `AVG(s.total_amount) as ticket_medio`
- ❌ `SELECT * FROM users --`
- ❌ `DROP TABLE sales`

### 3. **Queries Parametrizadas**

**Problema:** Concatenação de strings permite SQL Injection
**Solução:** Uso de placeholders e psycopg3 com bind parameters

```python
# Sempre usa %s placeholders
query = "SELECT * FROM sales WHERE channel_id = %s"
await db.fetch_all(query, (channel_id,))
```

### 4. **Limite de Resultados**

**Problema:** Queries sem limite podem sobrecarregar o banco
**Solução:** Hard limit de 1000 registros

```typescript
limit: Math.min(config.limit, 1000)
```

### 5. **Validação de Input**

**Problema:** Campos maliciosos podem causar erros ou exploits
**Solução:** Validação em múltiplas camadas

- **Frontend:** Dropdowns apenas com valores válidos
- **Backend:** HTTPException 400 para valores inválidos
- **Database:** Prepared statements previnem injection

### 6. **Sanitização de Filtros**

**Problema:** Filtros podem conter SQL malicioso
**Solução:** Backend valida campos e operadores

```python
ALLOWED_OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'LIKE', 'IN']
```

### 7. **Sem Execução Direta de SQL**

**Problema:** Permitir `raw_sql` seria extremamente perigoso
**Solução:** Query Builder NUNCA aceita SQL direto

```python
# ❌ NÃO IMPLEMENTADO (inseguro):
# @router.post("/raw-query")
# async def execute_raw_sql(sql: str): ...

# ✅ IMPLEMENTADO (seguro):
@router.post("/query")
async def execute_analytics_query(request: AnalyticsQueryRequest): ...
```

## 🛡️ Proteções Adicionais Recomendadas

### Para Produção:

1. **Rate Limiting**
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/query")
@limiter.limit("10/minute")  # Máximo 10 queries por minuto
async def execute_analytics_query(...):
```

2. **Autenticação e Autorização**
```python
from fastapi import Depends
from app.auth import get_current_user

@router.post("/query")
async def execute_analytics_query(
    request: AnalyticsQueryRequest,
    user: User = Depends(get_current_user)  # Requer login
):
```

3. **Audit Logging**
```python
logger.info(f"Query executed by user {user.id}: {request.metrics}")
```

4. **Query Timeout**
```python
# PostgreSQL
await db.execute("SET statement_timeout = '30s'")
```

5. **Read-Only Database User**
```bash
# Criar usuário apenas com SELECT
CREATE USER analytics_readonly WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
```

## 🚨 O Que NÃO Fazer

❌ **Nunca concatene SQL com strings de usuário**
```python
# ERRADO - vulnerável a SQL Injection
query = f"SELECT * FROM sales WHERE channel = '{user_input}'"
```

❌ **Nunca permita campos dinâmicos sem validação**
```python
# ERRADO - permite qualquer coluna
order_by = f"ORDER BY {request.sort_field}"
```

❌ **Nunca desabilite validação por performance**
```python
# ERRADO - abre brecha de segurança
if fast_mode:
    return execute_raw_sql(request.sql)  # PERIGO!
```

## ✅ Estado Atual

### Implementado:
- ✅ Whitelist de métricas e dimensões
- ✅ Validação de métricas customizadas
- ✅ Queries parametrizadas
- ✅ Limite de resultados (1000)
- ✅ Validação de input
- ✅ Mensagem de segurança no UI
- ✅ Sem SQL direto permitido

### Recomendado para Produção:
- ⏰ Rate limiting
- ⏰ Autenticação obrigatória
- ⏰ Audit logging
- ⏰ Query timeout
- ⏰ Read-only database user
- ⏰ HTTPS obrigatório
- ⏰ CORS restrito

## 📚 Referências

- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

## 🎯 Conclusão

O Query Builder atual é **seguro para uso interno** em ambientes controlados. Para **produção pública**, implemente as proteções adicionais recomendadas acima.

**Princípio:** Nunca confie em input do usuário. Sempre valide, sempre sanitize, sempre use prepared statements.
