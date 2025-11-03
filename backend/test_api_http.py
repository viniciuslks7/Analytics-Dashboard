import requests
import json

url = "http://localhost:8000/api/v1/analytics/query"
payload = {
    "metrics": ["tempo_medio_entrega", "qtd_vendas"],
    "dimensions": ["bairro"],
    "filters": {},
    "order_by": [{"field": "qtd_vendas", "direction": "desc"}],
    "limit": 15
}

print("\n" + "="*80)
print("🔍 TESTE API - Top 15 bairros por volume de entregas")
print("="*80 + "\n")

try:
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    data = response.json()
    
    print(f"{'#':<4} {'Bairro':<35} {'Entregas':>12} {'Tempo Médio':>15}")
    print("="*80)
    
    for i, row in enumerate(data['data']):
        bairro = row.get('bairro')
        if bairro is None or bairro == '':
            bairro = '(None/Empty)'
        qtd = row.get('qtd_vendas')
        if qtd is None:
            qtd = 0
        tempo = row.get('tempo_medio_entrega')
        if tempo is None:
            tempo = 0.0
        print(f"{i+1:<4} {str(bairro):<35} {int(qtd):>12,} {float(tempo):>12.1f} min")
    
    print("\n" + "="*80)
    print(f"Total de linhas retornadas: {len(data['data'])}")
    print("="*80 + "\n")
    
    # Check for None values
    none_count = sum(1 for row in data['data'] if row.get('bairro') is None or row.get('bairro') == '')
    empty_count = sum(1 for row in data['data'] if row.get('bairro') == '')
    
    print(f"Linhas com bairro=None: {none_count}")
    print(f"Linhas com bairro='': {empty_count}")
    
except requests.exceptions.RequestException as e:
    print(f"❌ Erro na requisição: {e}")
except Exception as e:
    print(f"❌ Erro: {e}")
