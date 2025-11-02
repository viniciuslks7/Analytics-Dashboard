# 🚀 Início Rápido

## ⚡ Executar tudo com 1 comando

### Windows PowerShell (Recomendado)
```powershell
.\start.ps1
```

### Windows CMD
```cmd
start.bat
```

**O script faz automaticamente:**
- ✅ Libera as portas 8000 e 5173 (mata processos antigos)
- ✅ Inicia **Backend** (FastAPI) em nova janela
- ✅ Inicia **Frontend** (React + Vite) em nova janela
- ✅ Abre o navegador em http://localhost:5173

---

## 🛑 Parar servidores

### PowerShell
```powershell
.\stop.ps1
```

### CMD
```cmd
stop.bat
```

---

## 📍 URLs

Após executar `start.ps1`:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Dashboard React |
| **Backend** | http://localhost:8000 | API FastAPI |
| **Swagger** | http://localhost:8000/docs | Documentação interativa |
| **ReDoc** | http://localhost:8000/redoc | Documentação alternativa |

---

## 🔧 Setup Inicial (Primeira vez)

### 1. Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Frontend
```powershell
cd frontend
npm install
```

### 3. Docker (PostgreSQL)
```powershell
docker-compose up -d
```

### 4. Dados de Teste
```powershell
cd backend
python generate_data.py
python create_views.py
```

---

## 📦 Estrutura

```
.
├── start.ps1          # ⚡ Iniciar tudo
├── stop.ps1           # 🛑 Parar tudo
├── backend/           # FastAPI + PostgreSQL
│   ├── venv/          # Ambiente virtual Python
│   └── app/           # Código da API
├── frontend/          # React + TypeScript + Vite
│   └── src/           # Código do dashboard
└── docker-compose.yml # PostgreSQL container
```

---

## 💡 Dicas

- Cada servidor abre em sua própria janela com logs visíveis
- Use `Ctrl+C` em cada janela para parar individualmente
- Ou use `stop.ps1` para parar tudo de uma vez
- O navegador abre automaticamente após 7 segundos

---

## 📚 Mais Documentos

- **[README.md](./README.md)** - Documentação completa do projeto
- **[SCRIPTS.md](./SCRIPTS.md)** - Detalhes dos scripts de automação
- **[SPECKIT.md](./SPECKIT.md)** - Especificação técnica original
- **[PLANO_MELHORIAS.md](./PLANO_MELHORIAS.md)** - Plano de features (14 itens)
- **[STATUS_IMPLEMENTACAO.md](./STATUS_IMPLEMENTACAO.md)** - Gap analysis
