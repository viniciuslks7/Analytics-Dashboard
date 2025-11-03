"""
Modelos para sistema de alertas
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID, uuid4


class AlertCondition(BaseModel):
    """Condição do alerta"""
    metric: str = Field(..., description="Nome da métrica a monitorar")
    operator: Literal["gt", "lt", "eq", "gte", "lte"] = Field(..., description="Operador de comparação")
    threshold: float = Field(..., description="Valor limite")


class AlertCreate(BaseModel):
    """Request para criar alerta"""
    name: str = Field(..., description="Nome do alerta")
    description: Optional[str] = Field(None, description="Descrição do alerta")
    condition: AlertCondition
    enabled: bool = Field(True, description="Se o alerta está ativo")
    notification_channels: List[Literal["toast", "email", "webhook"]] = Field(
        default=["toast"], 
        description="Canais de notificação"
    )


class AlertUpdate(BaseModel):
    """Request para atualizar alerta"""
    name: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[AlertCondition] = None
    enabled: Optional[bool] = None
    notification_channels: Optional[List[str]] = None


class Alert(AlertCreate):
    """Modelo de alerta completo"""
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_triggered_at: Optional[datetime] = None
    trigger_count: int = Field(0, description="Quantas vezes foi disparado")


class AlertCheckResult(BaseModel):
    """Resultado da verificação de alerta"""
    alert_id: UUID
    alert_name: str
    triggered: bool
    current_value: float
    threshold: float
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
