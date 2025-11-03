# 🚀 Guia de Deploy - Analytics Dashboard

Este guia fornece instruções passo a passo para fazer o deploy da aplicação completa (frontend + backend + banco de dados) usando **Vercel** (frontend) e **Render** (backend + PostgreSQL).

## 📋 Pré-requisitos

- [ ] Conta no GitHub
- [ ] Conta no Vercel (gratuita): https://vercel.com
- [ ] Conta no Render (gratuita): https://render.com
- [ ] Repositório Git com o código da aplicação

---

## 🗄️ Parte 1: Deploy do Backend + Banco de Dados (Render)

### 1.1 - Criar Banco de Dados PostgreSQL

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `analytics-dashboard-db`
   - **Database**: `analytics_db`
   - **User**: `analytics_user` (ou deixe padrão)
   - **Region**: `Oregon (US West)` (ou mais próximo)
   - **Plan**: **Free** (0$/mês)
4. Clique em **"Create Database"**
5. ⚠️ **IMPORTANTE**: Copie a **Internal Database URL** (começando com `postgresql://...`)
   - Guarde esta URL, você usará no próximo passo

### 1.2 - Criar Web Service (Backend API)

1. No dashboard do Render, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `analytics-dashboard-api`
   - **Region**: `Oregon (US West)` (mesma do banco)
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: `backend`
   - **Runtime**: **Python 3**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free** (0$/mês)

4. **Environment Variables** (clique em "Advanced" → "Add Environment Variable"):
   ```
   PYTHON_VERSION = 3.12.0
   DATABASE_URL = [Cole aqui a Internal Database URL do passo 1.1]
   REDIS_URL = redis://localhost:6379
   ENVIRONMENT = production
   ALLOWED_ORIGINS = https://seu-frontend.vercel.app
   ```
   > ⚠️ **Atenção**: Você atualizará `ALLOWED_ORIGINS` depois de fazer deploy do frontend

5. **Health Check**: Configure em "Advanced"
   - **Health Check Path**: `/health`

6. Clique em **"Create Web Service"**

### 1.3 - Aguardar Deploy do Backend

- O Render irá construir e iniciar seu backend
- Acompanhe os logs para verificar se não há erros
- Quando aparecer "✓ Live", copie a URL do serviço (ex: `https://analytics-dashboard-api.onrender.com`)
- Teste acessando: `https://sua-url.onrender.com/health` (deve retornar `{"status":"healthy"}`)

---

## 🎨 Parte 2: Deploy do Frontend (Vercel)

### 2.1 - Importar Projeto no Vercel

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Conecte com GitHub e selecione seu repositório
4. Configure:
   - **Project Name**: `analytics-dashboard`
   - **Framework Preset**: **Vite**
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (detectado automaticamente)
   - **Output Directory**: `dist` (detectado automaticamente)

### 2.2 - Configurar Variáveis de Ambiente

1. Em **"Environment Variables"**, adicione:
   ```
   VITE_API_URL = https://analytics-dashboard-api.onrender.com
   ```
   > ⚠️ Substitua pela URL do seu backend (copiada no passo 1.3)

2. Clique em **"Deploy"**

### 2.3 - Aguardar Deploy do Frontend

- O Vercel irá construir e publicar seu frontend
- Quando concluir, você receberá uma URL (ex: `https://analytics-dashboard-abc123.vercel.app`)
- ⚠️ **Copie esta URL**, você precisará dela no próximo passo

---

## 🔗 Parte 3: Conectar Frontend e Backend

### 3.1 - Atualizar CORS no Backend

1. Volte ao dashboard do Render: https://dashboard.render.com
2. Acesse seu web service **analytics-dashboard-api**
3. Vá em **"Environment"**
4. Edite a variável `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://analytics-dashboard-abc123.vercel.app
   ```
   > ⚠️ Substitua pela URL do seu frontend no Vercel

5. Clique em **"Save Changes"**
6. O Render irá fazer redeploy automaticamente

---

## 🗃️ Parte 4: Popular o Banco de Dados

Agora você precisa inserir os dados no PostgreSQL hospedado no Render. Existem 3 opções:

### Opção A: Usar Docker (nola-repo) - **RECOMENDADO**

1. No seu computador local, edite o arquivo `.env` do nola-repo:
   ```bash
   DATABASE_URL=postgresql://analytics_user:sua-senha@dpg-xxxxx.oregon-postgres.render.com:5432/analytics_db
   ```
   > Use a **External Database URL** do Render (Dashboard → Database → Connection)

2. Execute o script de geração de dados:
   ```bash
   cd nola-repo
   python generate_data.py
   ```

3. Aguarde a conclusão (pode levar alguns minutos)

### Opção B: Exportar e Importar com pg_dump/pg_restore

1. **Exportar dados locais**:
   ```bash
   pg_dump -h localhost -U postgres -d analytics_db -Fc -f analytics_backup.dump
   ```

2. **Importar no Render**:
   ```bash
   pg_restore -h dpg-xxxxx.oregon-postgres.render.com -U analytics_user -d analytics_db -v analytics_backup.dump
   ```
   > Use as credenciais do Render (Dashboard → Database → Connection)

### Opção C: Usar SQL direto

1. Acesse o Render Dashboard → Database → **"Connect"** → **"External Connection"**
2. Use um cliente SQL (DBeaver, pgAdmin, psql)
3. Execute os scripts SQL do seu backup

---

## ✅ Parte 5: Verificação Final

### 5.1 - Testar Backend

```bash
# Health check
curl https://analytics-dashboard-api.onrender.com/health

# Testar endpoint de analytics
curl https://analytics-dashboard-api.onrender.com/api/v1/analytics/kpis
```

### 5.2 - Testar Frontend

1. Acesse sua URL do Vercel: `https://analytics-dashboard-abc123.vercel.app`
2. Verifique se:
   - [ ] Dashboard carrega sem erros
   - [ ] Gráficos são exibidos com dados
   - [ ] Filtros funcionam corretamente
   - [ ] Churn Analysis carrega
   - [ ] Alerts página funciona

### 5.3 - Verificar Logs

- **Backend logs**: Render Dashboard → Web Service → Logs
- **Frontend logs**: Vercel Dashboard → Deployments → Logs
- **Database logs**: Render Dashboard → Database → Logs

---

## 🔄 Atualizações Futuras

### Atualizar Backend

1. Faça commit e push das alterações no GitHub
2. Render detectará automaticamente e fará redeploy

### Atualizar Frontend

1. Faça commit e push das alterações no GitHub
2. Vercel detectará automaticamente e fará redeploy

### Atualizar Variáveis de Ambiente

- **Render**: Dashboard → Web Service → Environment → Edit
- **Vercel**: Dashboard → Project → Settings → Environment Variables

---

## ⚠️ Limitações do Plano Free

### Render Free Tier:
- ⏱️ **Inatividade**: Backend "dorme" após 15 minutos sem requisições
- 🐌 **Cold Start**: Primeira requisição pode demorar ~30 segundos
- 💾 **Banco de dados**: 1GB de storage
- 🕐 **Duração**: 750 horas/mês de compute

### Vercel Free Tier:
- 📦 **Bandwidth**: 100GB/mês
- ⚡ **Builds**: 6,000 minutos/mês
- 📄 **Deployments**: Ilimitados

**Solução para Cold Start**:
- Use um serviço de ping (ex: UptimeRobot) para fazer requisições a cada 10 minutos
- Configuração: `https://uptimerobot.com` → Monitor → HTTP → URL do health check

---

## 🛠️ Troubleshooting

### Backend não inicia

1. Verifique logs no Render Dashboard
2. Confirme que `requirements.txt` está correto
3. Verifique se `DATABASE_URL` está correta
4. Teste localmente primeiro: `uvicorn app.main:app --reload`

### Frontend não conecta no backend

1. Verifique se `VITE_API_URL` está correto no Vercel
2. Confirme que `ALLOWED_ORIGINS` inclui a URL do Vercel no Render
3. Verifique CORS: abra DevTools → Network → veja se há erros de CORS

### Banco de dados vazio

1. Confirme que os dados foram populados (Opção A, B ou C)
2. Conecte no banco via cliente SQL e verifique:
   ```sql
   SELECT COUNT(*) FROM sales;
   SELECT COUNT(*) FROM customers;
   ```

### 500 Internal Server Error

1. Verifique logs do backend no Render
2. Geralmente é erro de conexão com banco ou variável de ambiente faltando

---

## 📞 Suporte

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

## 🎉 Pronto!

Sua aplicação agora está em produção com:
- ✅ Frontend hospedado no Vercel (CDN global)
- ✅ Backend API no Render com PostgreSQL
- ✅ SSL/HTTPS automático
- ✅ Deploy contínuo (Git push → Deploy automático)
- ✅ Monitoramento e logs
- ✅ 100% grátis (plano free)

**URLs Finais**:
- Frontend: `https://analytics-dashboard-abc123.vercel.app`
- Backend: `https://analytics-dashboard-api.onrender.com`
- Health Check: `https://analytics-dashboard-api.onrender.com/health`
