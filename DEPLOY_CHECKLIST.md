# ✅ Checklist de Deploy

Use este checklist para garantir que todos os passos foram concluídos corretamente.

## 📝 Pré-Deploy

- [ ] Código commitado no GitHub
- [ ] Conta Vercel criada
- [ ] Conta Render criada
- [ ] `.env.example` revisado no frontend

---

## 🗄️ Backend (Render)

### Banco de Dados PostgreSQL
- [ ] Database criado no Render
- [ ] Internal Database URL copiada
- [ ] External Database URL copiada (para popular dados)

### Web Service
- [ ] Web Service criado conectado ao GitHub
- [ ] Root Directory = `backend`
- [ ] Build Command = `pip install -r requirements.txt`
- [ ] Start Command = `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Health Check Path = `/health`

### Environment Variables
- [ ] `PYTHON_VERSION = 3.12.0`
- [ ] `DATABASE_URL = [Internal Database URL]`
- [ ] `REDIS_URL = redis://localhost:6379`
- [ ] `ENVIRONMENT = production`
- [ ] `ALLOWED_ORIGINS = [URL do Vercel - atualizar depois]`

### Verificação
- [ ] Deploy concluído sem erros
- [ ] Backend URL copiada (ex: `https://xxx.onrender.com`)
- [ ] Health check funcionando: `/health` retorna `{"status":"healthy"}`

---

## 🎨 Frontend (Vercel)

### Projeto
- [ ] Projeto importado do GitHub
- [ ] Root Directory = `frontend`
- [ ] Framework Preset = Vite
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`

### Environment Variables
- [ ] `VITE_API_URL = [URL do Backend no Render]`

### Verificação
- [ ] Deploy concluído sem erros
- [ ] Frontend URL copiada (ex: `https://xxx.vercel.app`)
- [ ] Site abre sem erros no console

---

## 🔗 Conexão

- [ ] `ALLOWED_ORIGINS` no Render atualizado com URL do Vercel
- [ ] Backend redeployado após atualização
- [ ] Dashboard carrega dados corretamente
- [ ] Sem erros de CORS no console

---

## 🗃️ Banco de Dados

Escolha UMA opção:

### Opção A: Docker (nola-repo)
- [ ] `.env` do nola-repo atualizado com External Database URL
- [ ] Script `generate_data.py` executado
- [ ] Dados inseridos com sucesso (607k sales)

### Opção B: pg_dump/pg_restore
- [ ] Backup local criado com `pg_dump`
- [ ] Backup importado no Render com `pg_restore`
- [ ] Tabelas verificadas no banco

### Opção C: SQL direto
- [ ] Cliente SQL conectado ao Render
- [ ] Scripts SQL executados
- [ ] Dados verificados

### Verificação Final
- [ ] Query no banco: `SELECT COUNT(*) FROM sales;` retorna ~607k
- [ ] Query no banco: `SELECT COUNT(*) FROM customers;` retorna ~30k

---

## ✅ Testes Finais

### Backend
- [ ] `/health` retorna 200 OK
- [ ] `/api/v1/analytics/kpis` retorna dados
- [ ] Sem erros nos logs do Render

### Frontend
- [ ] Dashboard carrega
- [ ] KPIs mostram valores corretos
- [ ] Gráficos renderizam
- [ ] Filtros funcionam
- [ ] Churn Analysis funciona
- [ ] Alerts página funciona
- [ ] Navegação entre páginas sem erros
- [ ] Sem erros no console do navegador

### Performance
- [ ] Primeira requisição < 30s (cold start)
- [ ] Requisições seguintes < 2s
- [ ] Gráficos carregam em < 3s

---

## 🔄 Pós-Deploy

- [ ] URLs documentadas em local seguro
- [ ] Credenciais do banco salvas
- [ ] UptimeRobot configurado (opcional - evita cold start)
- [ ] Equipe notificada das URLs de produção

---

## 📊 Monitoramento

### Configurar Alertas (Opcional)
- [ ] Render: Email notifications habilitado
- [ ] Vercel: Email notifications habilitado
- [ ] UptimeRobot: Monitor criado para health check

### Métricas para Acompanhar
- [ ] Uptime do backend
- [ ] Tempo de resposta
- [ ] Erros 5xx
- [ ] Uso de bandwidth
- [ ] Storage do banco de dados

---

## 🎉 Deploy Completo!

Quando todos os itens estiverem marcados, sua aplicação está 100% em produção!

**Próximos Passos**:
1. Compartilhe as URLs com stakeholders
2. Documente qualquer customização
3. Configure backup automático (Render tem snapshots no plano pago)
4. Considere upgrade se ultrapassar limites do free tier
