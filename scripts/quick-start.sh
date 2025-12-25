#!/bin/bash

# Quick Start para testar Fase 7
# Execute este script para verificar se tudo está funcionando

echo "🚀 PromptLab - Quick Start (Phase 7)"
echo "====================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Execute: 'docker compose up -d'"
  exit 1
fi

# Check if Redis is running
if ! docker ps | grep -q redis; then
  echo "📦 Iniciando Redis e PostgreSQL..."
  docker compose up -d
  echo "⏳ Aguardando 3 segundos..."
  sleep 3
fi

echo "✅ Docker services OK"
echo ""

# Check if API is running
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo "⚠️  API não está rodando"
  echo ""
  echo "Para iniciar a API, abra um terminal e execute:"
  echo "  npx dotenv -e .env -- npx tsx apps/api/src/index.ts"
  echo ""
  echo "Para iniciar o Worker, abra outro terminal e execute:"
  echo "  npx dotenv -e .env -- npx tsx apps/worker/src/index.ts"
  echo ""
  exit 1
fi

echo "✅ API está rodando em http://localhost:4000"
echo ""

# Run quick test
echo "🧪 Executando teste rápido..."
echo ""

TEMPLATE_ID="cmjlfawzg0000pq6xyq5r78ws"

# Test 1: Create job
echo "1. Criando job..."
RESPONSE=$(curl -s -X POST http://localhost:4000/generate \
  -H "Content-Type: application/json" \
  -d "{\"templateId\":\"$TEMPLATE_ID\",\"provider\":\"anthropic\",\"input\":\"Hello World\"}")

JOB_ID=$(echo "$RESPONSE" | jq -r '.jobId')
IS_CACHED=$(echo "$RESPONSE" | jq -r '.cached // false')

if [ "$IS_CACHED" = "true" ]; then
  echo "   ⚡ Cache HIT - Job retornado instantaneamente"
  echo "   💰 Custo: $0 (cache hit)"
else
  echo "   ✅ Job criado: $JOB_ID"
  echo "   ⏳ Aguardando 8 segundos para completar..."
  sleep 8
fi

# Test 2: Check result
echo ""
echo "2. Consultando resultado..."
RESULT=$(curl -s "http://localhost:4000/jobs/$JOB_ID")
STATUS=$(echo "$RESULT" | jq -r '.status')
COST=$(echo "$RESULT" | jq -r '.estimatedCostUSD // 0')

echo "   Status: $STATUS"
if [ "$STATUS" = "completed" ]; then
  echo "   💰 Custo: \$$COST"
  echo "   ✅ Job completado com sucesso!"
else
  echo "   ⏳ Job ainda processando (status: $STATUS)"
fi

# Test 3: Duplicate request (should hit cache)
echo ""
echo "3. Testando cache (request duplicado)..."
START=$(date +%s)
RESPONSE2=$(curl -s -X POST http://localhost:4000/generate \
  -H "Content-Type: application/json" \
  -d "{\"templateId\":\"$TEMPLATE_ID\",\"provider\":\"anthropic\",\"input\":\"Hello World\"}")
END=$(date +%s)
ELAPSED=$((END - START))

JOB_ID2=$(echo "$RESPONSE2" | jq -r '.jobId')
IS_CACHED2=$(echo "$RESPONSE2" | jq -r '.cached // false')

if [ "$IS_CACHED2" = "true" ]; then
  echo "   ⚡ CACHE HIT! Job retornado em ${ELAPSED}s"
  echo "   💰 Economia: \$$COST (não fez chamada LLM)"
  echo "   ✅ Cache funcionando!"
else
  echo "   ⚠️  Cache miss (talvez job ainda não completou)"
fi

# Test 4: Rate limit check
echo ""
echo "4. Testando rate limit (10 requests rápidos)..."
SUCCESS=0
RATE_LIMITED=0

for i in {1..10}; do
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:4000/generate \
    -H "Content-Type: application/json" \
    -d "{\"templateId\":\"$TEMPLATE_ID\",\"provider\":\"anthropic\",\"input\":\"Test $i\"}")
  
  if [ "$STATUS_CODE" = "200" ]; then
    ((SUCCESS++))
  elif [ "$STATUS_CODE" = "429" ]; then
    ((RATE_LIMITED++))
  fi
done

echo "   ✅ Success: $SUCCESS"
echo "   🛡️  Rate limited: $RATE_LIMITED"

if [ $SUCCESS -eq 10 ]; then
  echo "   ✅ Rate limit OK (10 requests permitidos)"
else
  echo "   ⚠️  Rate limit pode estar ativo (${RATE_LIMITED} bloqueados)"
fi

# Summary
echo ""
echo "====================================="
echo "✅ Quick test completo!"
echo ""
echo "Para teste completo de rate limiting, execute:"
echo "  ./scripts/test-phase7.sh"
echo ""
echo "Para ver resultados no Prisma Studio:"
echo "  npx prisma studio --schema=./packages/db/prisma/schema.prisma"
echo ""
echo "====================================="
