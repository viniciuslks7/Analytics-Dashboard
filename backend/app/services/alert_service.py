"""
Serviço de gerenciamento de alertas
"""
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime

from app.models.alert import Alert, AlertCreate, AlertUpdate, AlertCheckResult, AlertCondition


class AlertService:
    """Gerenciamento de alertas em memória (pode ser migrado para DB depois)"""
    
    def __init__(self):
        self.alerts: Dict[UUID, Alert] = {}
    
    def create_alert(self, alert_data: AlertCreate) -> Alert:
        """Cria um novo alerta"""
        alert = Alert(**alert_data.model_dump())
        self.alerts[alert.id] = alert
        return alert
    
    def get_alert(self, alert_id: UUID) -> Optional[Alert]:
        """Obtém um alerta por ID"""
        return self.alerts.get(alert_id)
    
    def list_alerts(self, enabled_only: bool = False) -> List[Alert]:
        """Lista todos os alertas"""
        alerts = list(self.alerts.values())
        if enabled_only:
            alerts = [a for a in alerts if a.enabled]
        # Ordenar por data de criação (mais recentes primeiro)
        return sorted(alerts, key=lambda x: x.created_at, reverse=True)
    
    def update_alert(self, alert_id: UUID, alert_data: AlertUpdate) -> Optional[Alert]:
        """Atualiza um alerta existente"""
        alert = self.alerts.get(alert_id)
        if not alert:
            return None
        
        # Atualizar apenas campos fornecidos
        update_dict = alert_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(alert, key, value)
        
        alert.updated_at = datetime.utcnow()
        return alert
    
    def delete_alert(self, alert_id: UUID) -> bool:
        """Deleta um alerta"""
        if alert_id in self.alerts:
            del self.alerts[alert_id]
            return True
        return False
    
    def check_condition(self, condition: AlertCondition, current_value: float) -> bool:
        """Verifica se a condição do alerta foi atendida"""
        operator = condition.operator
        threshold = condition.threshold
        
        if operator == "gt":
            return current_value > threshold
        elif operator == "lt":
            return current_value < threshold
        elif operator == "eq":
            return current_value == threshold
        elif operator == "gte":
            return current_value >= threshold
        elif operator == "lte":
            return current_value <= threshold
        
        return False
    
    def check_alert(self, alert: Alert, current_metrics: Dict[str, float]) -> AlertCheckResult:
        """Verifica se um alerta deve ser disparado"""
        metric = alert.condition.metric
        current_value = current_metrics.get(metric, 0.0)
        
        triggered = self.check_condition(alert.condition, current_value)
        
        # Atualizar contador se disparado
        if triggered:
            alert.last_triggered_at = datetime.utcnow()
            alert.trigger_count += 1
        
        # Gerar mensagem
        operator_labels = {
            "gt": "maior que",
            "lt": "menor que",
            "eq": "igual a",
            "gte": "maior ou igual a",
            "lte": "menor ou igual a"
        }
        operator_label = operator_labels.get(alert.condition.operator, alert.condition.operator)
        
        if triggered:
            message = f"⚠️ Alerta '{alert.name}': {metric} ({current_value:.2f}) está {operator_label} {alert.condition.threshold:.2f}"
        else:
            message = f"✅ Alerta '{alert.name}': {metric} ({current_value:.2f}) está OK"
        
        return AlertCheckResult(
            alert_id=alert.id,
            alert_name=alert.name,
            triggered=triggered,
            current_value=current_value,
            threshold=alert.condition.threshold,
            message=message
        )
    
    def check_all_alerts(self, current_metrics: Dict[str, float]) -> List[AlertCheckResult]:
        """Verifica todos os alertas ativos"""
        results = []
        for alert in self.list_alerts(enabled_only=True):
            result = self.check_alert(alert, current_metrics)
            results.append(result)
        return results


# Instância global do serviço
alert_service = AlertService()
