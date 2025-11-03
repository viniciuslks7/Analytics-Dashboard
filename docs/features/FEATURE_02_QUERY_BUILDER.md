# ⚠️ Feature #02: Query Builder Customizável - REMOVIDA

> **❌ ATENÇÃO: Esta feature foi REMOVIDA do sistema em 03/11/2025**
> 
> **Motivo:** Questões de segurança relacionadas a SQL injection  
> **Status:** Documentação mantida apenas como referência histórica  
> **Substituído por:** Queries pré-definidas e endpoints específicos

---

## 📋 Visão Geral (HISTÓRICO)

Sistema de construção de queries visuais que **permitia** usuários não-técnicos criarem análises customizadas sem escrever SQL. Interface drag-and-drop (ou seletores) para escolher métricas, dimensões, filtros e ordenação, gerando queries seguras e otimizadas automaticamente.

**⚠️ NOTA:** Esta funcionalidade não está mais disponível no sistema atual.

---

## 🎯 Objetivo (HISTÓRICO)

Democratizar acesso a dados permitindo que donos de restaurantes criem suas próprias análises sem conhecimento técnico:
- **Sem SQL**: Interface visual intuitiva
- **Sem Código**: Point-and-click para criar queries
- **Sem Limites**: Combinações ilimitadas de métricas e dimensões
- **Sem Riscos**: Proteção contra SQL injection ⚠️ *Removido por este motivo*

---

## ❌ Por que foi removida?

A feature foi removida devido a:

1. **Riscos de Segurança**: Mesmo com whitelists e validações, query builders dinâmicos podem ser vetores de SQL injection
2. **Complexidade**: Manutenção de whitelists para cada campo e validação de combinações aumentava complexidade
3. **Performance**: Queries dinâmicas dificultavam otimizações no banco de dados
4. **Alternativa Melhor**: Endpoints específicos com queries pré-otimizadas provaram ser mais seguros e rápidos

---

## 📝 Nota Final

**Detalhes técnicos de implementação foram removidos por questões de segurança.**

Para informações sobre a arquitetura atual do sistema, consulte:
- [ARCHITECTURE.md](../technical/ARCHITECTURE.md) - Arquitetura do sistema
- [FEATURE_INDEX.md](./FEATURE_INDEX.md) - Índice de features ativas

---

## 👤 Desenvolvedor

**Nome:** Vinicius Oliveira  
**Email:** vinicius.oliveiratwt@gmail.com  
**Data:** 03 de novembro de 2025

---

**Última Atualização:** 03/11/2025

---

**Desenvolvido por Vinicius Oliveira** · vinicius.oliveiratwt@gmail.com
