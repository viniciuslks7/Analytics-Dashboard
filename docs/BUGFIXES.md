# 🐛 Bugfixes - Todos os Bugs Corrigidos

---

## 🔴 Bugs Críticos

### Bug #1: Backend 500 - Column "canal_venda" does not exist
**Data:** 02/11/2025 23:56  
**Commit:** `ae53fd4`  
**Severidade:** 🔴 Crítica

**Erro:**
```
psycopg.errors.UndefinedColumn: column "canal_venda" does not exist
```

**Causa:** Backend usava nome do filtro diretamente no SQL sem mapear para coluna real.

**Solução:**
```python
DIMENSIONS_MAP = {
    'canal_venda': ('ch.name', 'channel'),
    'nome_loja': ('st.name', 'store'),
    # ...
}
```

---

### Bug #2: Drill-down Mostra Zeros
**Data:** 02/11/2025 23:48  
**Commit:** `b146795`  
**Severidade:** 🔴 Crítica

**Problema:** Modal abria mas KPIs mostravam R$ 0,00

**Causa:** Frontend enviava `canal_venda: 'iFood'` (string), backend esperava array.

**Solução:**
```typescript
// ❌ ANTES: result.canal_venda = context.value;
// ✅ DEPOIS: result.canal_venda = [context.value];
```

---

### Bug #3: Cache React Query Não Invalida
**Data:** 03/11/2025 00:10  
**Commit:** `1fa4c4f`  
**Severidade:** 🔴 Crítica

**Problema:** Drill-down funciona primeira vez, depois mostra dados errados.

**Causa:** React Query compara objetos por referência, não valor.

**Solução:**
```typescript
const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
queryKey: ['drill-down', filtersKey], // String estável
staleTime: 0, gcTime: 0
```

---

### Bug #4: Gráficos Não Renderizam (Race Condition)
**Data:** 03/11/2025 00:40  
**Commit:** `fcc91ea`  
**Severidade:** 🔴 Crítica

**Problema:** Dados chegam antes do DOM estar pronto.

**Solução:** Retry mechanism
```typescript
if (!chartRef.current) {
  setTimeout(() => {
    if (chartRef.current && !chartInstance.current) {
      renderChart();
    }
  }, 50);
  return;
}
```

---

### Bug #5: Modal Não Limpa Gráficos
**Data:** 03/11/2025 00:56  
**Commit:** `20a3060`  
**Severidade:** 🔴 Crítica

**Problema:** Gráficos só funcionam na primeira abertura do modal.

**Causa:** Ant Design Modal não desmonta conteúdo ao fechar (apenas esconde).

**Solução:**
```typescript
<Modal destroyOnClose={true}> // ✅
```

---

## 🟡 Bugs Médios

### Bug #6: Imports TypeScript Incorretos
**Data:** 02/11/2025 23:44  
**Commits:** `89be313`, `4fb75b3`

**Problema:** `Cannot find module './AlertsPage'`

**Solução:** Adicionar extensão `.tsx`
```typescript
// ❌ ANTES: from './pages/AlertsPage'
// ✅ DEPOIS: from './pages/AlertsPage.tsx'
```

---

### Bug #7: SQL Placeholders Errados
**Data:** 01/11/2025 23:18-23:20  
**Commits:** `21125f2`, `80e081d`

**Problema:** psycopg3 usa `%s`, não `$1, $2`

**Solução:** Substituir todos placeholders
```python
# ❌ ANTES: WHERE field = $1
# ✅ DEPOIS: WHERE field = %s
```

---

### Bug #8: Event Loop Windows
**Data:** 01/11/2025 23:35  
**Commit:** `566e8e7`

**Problema:** Backend travava no Windows.

**Solução:**
```python
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )
```

---

### Bug #9: Filtros Array vs Objeto
**Data:** 01/11/2025 20:18  
**Commit:** `5010474`

**Problema:** Frontend enviava `filters: []`, backend esperava `filters: {}`

**Solução:** Trocar array por objeto vazio.

---

### Bug #10: Parâmetros SQL None
**Data:** 01/11/2025 22:37  
**Commit:** `f0ac04e`

**Problema:** Queries falhavam com `params = None`

**Solução:**
```python
params = params or ()  # Tupla vazia
```

---

### Bug #11: Unicode Docker
**Data:** 01/11/2025 16:02  
**Commit:** `336933a`

**Problema:** `UnicodeDecodeError` ao gerar dados

**Solução:**
```dockerfile
ENV PYTHONIOENCODING=utf-8
ENV LANG=C.UTF-8
```

---

### Bug #12: psycopg-pool Faltando
**Data:** 01/11/2025 22:05  
**Commit:** `ab60d81`

**Problema:** Backend não iniciava

**Solução:** Adicionar ao requirements.txt
```
psycopg-pool==3.2.3
```

---

### Bug #13: order_by Formato Errado
**Data:** 01/11/2025 23:39  
**Commit:** `b883e82`

**Problema:** `order_by: "campo"` não funcionava

**Solução:**
```python
order_by: [{ field: "campo", direction: "asc" }]
```

---

### Bug #14: Coluna quantity Não Encontrada
**Data:** 01/11/2025 23:45  
**Commit:** `d681504`

**Problema:** SQL usava `quantity` sem prefixo

**Solução:** Usar `ps.quantity` com alias completo

---

### Bug #15: Imports Python Incorretos
**Data:** 03/11/2025 01:09  
**Commit:** `4fb75b3`

**Problema:** `from app.models.analytics import QueryRequest`

**Solução:**
```python
from app.models.schemas import AnalyticsQueryRequest
```

---

## 📊 Resumo

**Total de Bugs:** 15  
**Críticos:** 5  
**Médios:** 10  

**Bugs por Área:**
- Backend SQL/Database: 7
- Frontend React/TypeScript: 5
- Docker/Environment: 2
- Imports/Dependencies: 1

**Tempo Médio de Resolução:**
- Críticos: 10-30 minutos
- Médios: 5-15 minutos

---

**Última Atualização:** 03/11/2025 01:45
