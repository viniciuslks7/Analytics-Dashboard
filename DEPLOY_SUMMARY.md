# 📋 Resumo das Configurações de Deploy

## ✅ Arquivos Criados/Modificados para Deploy

### Backend Configuration

#### 1. `backend/render.yaml`
**Novo arquivo** - Configuração do Render para deploy automático
- Define serviço PostgreSQL (analytics-dashboard-db)
- Define web service (analytics-dashboard-api)
- Variáveis de ambiente: PYTHON_VERSION, DATABASE_URL, REDIS_URL, ENVIRONMENT, ALLOWED_ORIGINS
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health check: `/health`

#### 2. `backend/Procfile`
**Novo arquivo** - Define processo para plataformas compatíveis com Heroku
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### 3. `backend/runtime.txt`
**Novo arquivo** - Especifica versão Python
```
python-3.12.0
```

#### 4. `backend/app/config.py`
**MODIFICADO** - Suporte a variáveis de ambiente
- `API_PORT`: Agora lê de `os.getenv("PORT", "8000")`
- `__init__`: Parseia `ALLOWED_ORIGINS` de env var (comma-separated)
- Auto-desabilita DEBUG quando `ENVIRONMENT=production`

### Frontend Configuration

#### 5. `frontend/vercel.json`
**Novo arquivo** - Configuração do Vercel
- Framework: Vite
- Build: `npm run build` → output: `dist`
- Rewrites: SPA routing (todas rotas → /index.html)
- Headers: Cache-Control para assets (1 ano)
- Env: VITE_API_URL

#### 6. `frontend/.env.example`
**Novo arquivo** - Template de variáveis de ambiente
```
VITE_API_URL=http://localhost:8000
```

#### 7. `frontend/src/api/alerts.ts`
**MODIFICADO** - Padronizado para usar `VITE_API_URL`
- Antes: `import.meta.env.VITE_API_BASE_URL`
- Depois: `import.meta.env.VITE_API_URL`

#### 8. `frontend/src/hooks/useFilters.ts`
**MODIFICADO** - Usa variável de ambiente
- Adicionado: `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Todas as chamadas fetch agora usam `${API_BASE_URL}`

#### 9. `frontend/src/pages/ChurnDashboard.tsx`
**MODIFICADO** - Usa variável de ambiente
- Adicionado: `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- API client `churnAPI` agora usa `${API_BASE_URL}`

#### 10. `frontend/src/components/PeriodComparison/PeriodComparison.tsx`
**MODIFICADO** - Usa variável de ambiente
- Adicionado: `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'`
- Fetch de comparação agora usa `${API_BASE_URL}`

### Documentação

#### 11. `DEPLOY.md`
**Novo arquivo** - Guia completo de deploy
- Instruções passo a passo para Render (backend + DB)
- Instruções passo a passo para Vercel (frontend)
- Conexão entre frontend e backend (CORS)
- 3 opções para popular banco de dados
- Verificação final e troubleshooting
- Limitações do plano free
- URLs importantes e suporte

#### 12. `DEPLOY_CHECKLIST.md`
**Novo arquivo** - Checklist interativo
- Pré-deploy
- Backend (Render): Database + Web Service + Env Vars
- Frontend (Vercel): Projeto + Env Vars
- Conexão CORS
- Banco de dados (3 opções)
- Testes finais
- Monitoramento

---

## 🔧 Variáveis de Ambiente Necessárias

### Backend (Render)
```
PYTHON_VERSION=3.12.0
DATABASE_URL=postgresql://user:pass@host:5432/db  # Auto-injetado pelo Render
REDIS_URL=redis://localhost:6379
ENVIRONMENT=production
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://seu-backend.onrender.com
```

---

## 🚀 Como Fazer Deploy

### Opção Rápida
1. Leia `DEPLOY.md` - Guia passo a passo completo
2. Use `DEPLOY_CHECKLIST.md` - Marque cada item conforme avança

### Opção Detalhada
```bash
# 1. Backend (Render)
# - Criar database PostgreSQL
# - Criar web service apontando para pasta /backend
# - Configurar variáveis de ambiente
# - Aguardar build

# 2. Frontend (Vercel)
# - Importar repositório GitHub
# - Configurar root directory = /frontend
# - Adicionar VITE_API_URL com URL do backend
# - Deploy automático

# 3. Conectar
# - Atualizar ALLOWED_ORIGINS no Render com URL do Vercel
# - Redeploy do backend

# 4. Popular banco
# - Opção A: nola-repo com DATABASE_URL do Render
# - Opção B: pg_dump local → pg_restore no Render
# - Opção C: SQL direto via cliente
```

---

## ✅ Verificação Rápida

Após deploy, teste:

**Backend**:
```bash
curl https://seu-backend.onrender.com/health
# Deve retornar: {"status":"healthy"}

curl https://seu-backend.onrender.com/api/v1/analytics/kpis
# Deve retornar JSON com métricas
```

**Frontend**:
- Abra `https://seu-frontend.vercel.app`
- Verifique console (F12) - não deve ter erros
- Dashboard deve carregar com gráficos
- Filtros devem funcionar

---

## 🔄 Fluxo de Deploy Automático

Após configuração inicial:

1. **Código alterado** → Git push
2. **Vercel detecta** → Build + Deploy frontend (2-3 min)
3. **Render detecta** → Build + Deploy backend (3-5 min)
4. **Pronto!** → Aplicação atualizada automaticamente

---

## 💡 Dicas Importantes

### Performance
- ⚠️ Render Free tier "dorme" após 15 min sem requisições
- 🐌 Primeira requisição após "despertar" = ~30 segundos (cold start)
- ⚡ Requisições seguintes = rápidas (<2s)
- 💡 **Solução**: Use UptimeRobot para ping a cada 10 min

### Monitoramento
- Render Dashboard → Logs (erros do backend)
- Vercel Dashboard → Logs (erros do frontend)
- Browser DevTools → Console (erros do cliente)
- Render Dashboard → Metrics (CPU, Memória, Requisições)

### Custos
- ✅ **100% Grátis** com planos free
- 📊 Render Free: 750h/mês compute + 1GB PostgreSQL
- 📊 Vercel Free: 100GB bandwidth/mês + builds ilimitados
- 💰 Upgrade necessário apenas se ultrapassar limites

### Segurança
- ✅ SSL/HTTPS automático (Render + Vercel)
- ✅ CORS configurado corretamente
- ✅ Variáveis de ambiente protegidas
- ✅ Banco de dados com autenticação

---

## 📞 Suporte

Se tiver problemas:

1. **Consulte**: `DEPLOY.md` seção "Troubleshooting"
2. **Verifique**: `DEPLOY_CHECKLIST.md` - todos itens marcados?
3. **Logs**: Sempre verifique logs do Render/Vercel
4. **Docs oficiais**:
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
   - FastAPI: https://fastapi.tiangolo.com

---

## 🎉 Resultado Final

Aplicação completa em produção:
- ✅ Frontend no Vercel (CDN global, baixa latência)
- ✅ Backend no Render (Python, FastAPI)
- ✅ PostgreSQL no Render (1GB storage)
- ✅ HTTPS/SSL automático
- ✅ Deploy contínuo (Git → Produção automático)
- ✅ Monitoramento e logs
- ✅ 100% grátis (plano free)

**URLs Exemplo**:
- Frontend: `https://analytics-dashboard-abc123.vercel.app`
- Backend: `https://analytics-dashboard-api.onrender.com`
- Health: `https://analytics-dashboard-api.onrender.com/health`
