"""
Endpoints da API de alertas
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from uuid import UUID

from app.models.alert import Alert, AlertCreate, AlertUpdate, AlertCheckResult
from app.services.alert_service import alert_service
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.post("", response_model=Alert, status_code=status.HTTP_201_CREATED)
async def create_alert(alert_data: AlertCreate):
    """
    Cria um novo alerta
    
    Exemplo:
    ```json
    {
        "name": "Faturamento Baixo",
        "description": "Alerta quando faturamento diário < R$1000",
        "condition": {
            "metric": "faturamento",
            "operator": "lt",
            "threshold": 1000
        },
        "enabled": true,
        "notification_channels": ["toast"]
    }
    ```
    """
    alert = alert_service.create_alert(alert_data)
    return alert


@router.get("", response_model=List[Alert])
async def list_alerts(enabled_only: bool = False):
    """
    Lista todos os alertas
    
    Query params:
    - enabled_only: Se true, retorna apenas alertas ativos
    """
    alerts = alert_service.list_alerts(enabled_only=enabled_only)
    return alerts


@router.get("/{alert_id}", response_model=Alert)
async def get_alert(alert_id: UUID):
    """Obtém um alerta específico por ID"""
    alert = alert_service.get_alert(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alerta {alert_id} não encontrado"
        )
    return alert


@router.put("/{alert_id}", response_model=Alert)
async def update_alert(alert_id: UUID, alert_data: AlertUpdate):
    """
    Atualiza um alerta existente
    
    Você pode atualizar apenas os campos desejados.
    """
    alert = alert_service.update_alert(alert_id, alert_data)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alerta {alert_id} não encontrado"
        )
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(alert_id: UUID):
    """Deleta um alerta"""
    success = alert_service.delete_alert(alert_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alerta {alert_id} não encontrado"
        )
    return None


@router.post("/check", response_model=List[AlertCheckResult])
async def check_alerts(current_metrics: Dict[str, float]):
    """
    Verifica todos os alertas ativos com as métricas fornecidas
    
    Exemplo de request:
    ```json
    {
        "faturamento": 850.50,
        "ticket_medio": 35.20,
        "qtd_vendas": 45
    }
    ```
    
    Retorna lista de alertas que foram disparados.
    """
    results = alert_service.check_all_alerts(current_metrics)
    return results


@router.post("/check-current", response_model=List[AlertCheckResult])
async def check_alerts_with_current_data():
    """
    Verifica todos os alertas usando as métricas atuais do sistema
    
    Busca as métricas principais (faturamento, ticket médio, qtd vendas)
    e verifica todos os alertas ativos.
    """
    try:
        # Buscar métricas atuais do sistema
        from app.models.schemas import AnalyticsQueryRequest
        
        query_request = AnalyticsQueryRequest(
            metrics=["faturamento", "ticket_medio", "qtd_vendas", "tempo_medio_entrega"],
            dimensions=[]
        )
        
        result = await analytics_service.query(query_request)
        
        if not result.data or len(result.data) == 0:
            # Sem dados, retornar lista vazia
            return []
        
        # Extrair métricas da primeira linha
        current_metrics = {
            "faturamento": float(result.data[0].get("faturamento", 0)),
            "ticket_medio": float(result.data[0].get("ticket_medio", 0)),
            "qtd_vendas": float(result.data[0].get("qtd_vendas", 0)),
            "tempo_medio_entrega": float(result.data[0].get("tempo_medio_entrega", 0))
        }
        
        # Verificar alertas
        results = alert_service.check_all_alerts(current_metrics)
        
        # Retornar apenas alertas disparados
        return [r for r in results if r.triggered]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar alertas: {str(e)}"
        )
