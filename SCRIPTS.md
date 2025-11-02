# 🚀 Scripts de Execução

Este diretório contém scripts para facilitar o desenvolvimento.

## Scripts Disponíveis

### Windows PowerShell (Recomendado)

#### `start.ps1` - Iniciar servidores
```powershell
# Executar com PowerShell
.\start.ps1

# Ou com duplo clique (se executar scripts estiver habilitado)
```

**O que faz:**
- ✅ Verifica e libera as portas 8000 e 5173
- ✅ Inicia o **Backend** (FastAPI) em uma nova janela
- ✅ Inicia o **Frontend** (Vite + React) em outra janela
- ✅ Aguarda 5 segundos
- ✅ Abre automaticamente o navegador em `http://localhost:5173`

#### `stop.ps1` - Parar servidores
```powershell
.\stop.ps1
```

**O que faz:**
- 🛑 Para todos os processos nas portas 8000 e 5173
- 🛑 Fecha as janelas do backend e frontend

---

### Windows CMD (Alternativa)

#### `start.bat` - Iniciar servidores
```cmd
start.bat
```

#### `stop.bat` - Parar servidores
```cmd
stop.bat
```

---

## Primeira Execução

Se você receber erro de execução de scripts no PowerShell:

```powershell
# Habilitar execução de scripts (como Administrador)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Depois executar normalmente
.\start.ps1
```

---

## URLs dos Servidores

Após executar `start.ps1` ou `start.bat`:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Dicas

💡 **Para desenvolvimento:**
- Use `start.ps1` para iniciar tudo de uma vez
- Cada servidor abre em sua própria janela
- Veja os logs em tempo real em cada janela
- Use `Ctrl+C` em cada janela para parar individualmente

💡 **Para parar tudo rápido:**
- Execute `stop.ps1` ou `stop.bat`
- Ou feche as janelas manualmente

💡 **Problemas com portas:**
- Os scripts automaticamente liberam as portas antes de iniciar
- Se ainda houver problemas, execute `stop.ps1` primeiro

---

## Estrutura do Projeto

```
.
├── start.ps1          # Iniciar tudo (PowerShell)
├── start.bat          # Iniciar tudo (CMD)
├── stop.ps1           # Parar tudo (PowerShell)
├── stop.bat           # Parar tudo (CMD)
├── backend/           # FastAPI + PostgreSQL
│   └── app/
├── frontend/          # React + TypeScript + Vite
│   └── src/
└── README.md
```
