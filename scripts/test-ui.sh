#!/bin/bash

echo "🎨 PromptLab UI - Quick Test Script"
echo "===================================="
echo ""

API_URL="http://localhost:4000"
WEB_URL="http://localhost:3000"

echo "📋 Checklist de Testes:"
echo ""

# Check if API is running
echo -n "1. API rodando (port 4000)? "
if curl -s "$API_URL/templates" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ - Inicie a API primeiro: cd apps/api && npx dotenv -e ../../.env -- npx tsx src/index.ts"
    exit 1
fi

# Check if Web is running
echo -n "2. Web UI rodando (port 3000)? "
if curl -s "$WEB_URL" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ - Inicie a Web: cd apps/web && npm run dev"
    exit 1
fi

echo ""
echo "🧪 Testes de API:"
echo ""

# Test GET /templates
echo -n "3. GET /templates? "
TEMPLATES=$(curl -s "$API_URL/templates")
if echo "$TEMPLATES" | jq -e '. | type == "array"' > /dev/null 2>&1; then
    TEMPLATE_COUNT=$(echo "$TEMPLATES" | jq 'length')
    echo "✅ ($TEMPLATE_COUNT templates)"
    
    # Get first template ID if exists
    if [ "$TEMPLATE_COUNT" -gt 0 ]; then
        TEMPLATE_ID=$(echo "$TEMPLATES" | jq -r '.[0].id')
        echo "   └─ Primeiro template: $TEMPLATE_ID"
    fi
else
    echo "❌"
fi

# Test GET /jobs (new endpoint)
echo -n "4. GET /jobs? "
JOBS=$(curl -s "$API_URL/jobs")
if echo "$JOBS" | jq -e '. | type == "array"' > /dev/null 2>&1; then
    JOB_COUNT=$(echo "$JOBS" | jq 'length')
    echo "✅ ($JOB_COUNT jobs)"
    
    # Check job statuses
    if [ "$JOB_COUNT" -gt 0 ]; then
        COMPLETED=$(echo "$JOBS" | jq '[.[] | select(.status == "completed")] | length')
        RUNNING=$(echo "$JOBS" | jq '[.[] | select(.status == "running")] | length')
        QUEUED=$(echo "$JOBS" | jq '[.[] | select(.status == "queued")] | length')
        FAILED=$(echo "$JOBS" | jq '[.[] | select(.status == "failed")] | length')
        
        echo "   ├─ Completed: $COMPLETED"
        echo "   ├─ Running: $RUNNING"
        echo "   ├─ Queued: $QUEUED"
        echo "   └─ Failed: $FAILED"
    fi
else
    echo "❌"
fi

echo ""
echo "🌐 Teste Manual da UI:"
echo ""
echo "Abra o navegador e teste:"
echo ""
echo "1. Homepage:"
echo "   → $WEB_URL"
echo "   ✓ Veja hero section e features"
echo "   ✓ Clique nos botões de navegação"
echo ""
echo "2. Templates:"
echo "   → $WEB_URL/templates"
echo "   ✓ Veja listagem de templates"
echo "   ✓ Clique 'Novo Template'"
echo "   ✓ Preencha formulário e salve"
echo ""
echo "3. Generate:"
echo "   → $WEB_URL/generate"
echo "   ✓ Selecione um template"
echo "   ✓ Digite input"
echo "   ✓ Clique 'Gerar Conteúdo'"
echo "   ✓ Observe redirecionamento"
echo ""
echo "4. Jobs:"
echo "   → $WEB_URL/jobs"
echo "   ✓ Veja listagem de jobs"
echo "   ✓ Clique em um job para ver detalhes"
echo ""
echo "5. Job Detail:"
echo "   ✓ Veja status atualizar (se queued/running)"
echo "   ✓ Copie output quando completo"
echo "   ✓ Veja métricas de tokens e custo"
echo ""
echo "✨ Teste completo!"
echo ""
echo "📊 Endpoints disponíveis:"
echo "  GET  $API_URL/templates"
echo "  POST $API_URL/templates"
echo "  GET  $API_URL/templates/:id"
echo "  POST $API_URL/generate"
echo "  GET  $API_URL/jobs"
echo "  GET  $API_URL/jobs/:id"
