# 🎯 Fase 7 - Guia de Teste Rápido

## O Que Mudou?

### Antes da Fase 7
```
Cliente → API → DB → Create Job → Worker → LLM ($0.001) → Response (6s)
Cliente → API → DB → Create Job → Worker → LLM ($0.001) → Response (6s)  # Duplicata!
```

### Depois da Fase 7
```
Cliente → API → Redis Cache HIT ⚡ → Response (10ms, $0)  # Instant!
Cliente → API → Redis Cache MISS → DB → Create Job → Worker → LLM ($0.001) → Cache Result → Response (6s)
```

## Benefícios Concretos

### 💰 Economia de Custos

**Exemplo: Blog Post Generator**
- Prompt: "Write blog post about {{topic}}"
- Custo por geração: $0.001

**Sem cache (1000 requests com mesmo input):**
```
1000 requests × $0.001 = $1.00
```

**Com cache (1000 requests com mesmo input):**
```
1 LLM call = $0.001
999 cache hits = $0.000
Total = $0.001
Economia = 99.9%! 🎉
```

### ⚡ Performance

**Request duplicado:**
- Antes: 6 segundos (nova chamada LLM)
- Depois: 10ms (Redis cache)
- **Speedup: 600x**

### 🛡️ Segurança

**Rate Limiting:**
- Protege contra spam/DDoS
- Limita custos automáticos
- Headers informativos (`X-RateLimit-*`)

## Como Testar

### Setup (apenas primeira vez)

```bash
# 1. Certifique-se de ter Redis rodando
docker compose up -d

# 2. Em um terminal, inicie a API
npx dotenv -e .env -- npx tsx apps/api/src/index.ts

# 3. Em outro terminal, inicie o Worker
npx dotenv -e .env -- npx tsx apps/worker/src/index.ts
```

### Teste Rápido (2 minutos)

```bash
./scripts/quick-start.sh
```

Este script testa:
1. ✅ Criação de job normal
2. ⚡ Cache hit em request duplicado
3. 🛡️ Rate limiting (10 requests)

### Teste Completo (5 minutos)

```bash
./scripts/test-phase7.sh
```

Este script testa:
1. ✅ Criação de job e aguarda completar
2. ⚡ Cache hit com timing
3. 🛡️ Rate limiting intenso (105 requests)
4. 📊 Mostra savings estimados

## Entendendo os Resultados

### Cache Hit
```json
{
  "jobId": "cmjxxx...",
  "cached": true  // ← Indica cache hit!
}
```
**Significado:** Resultado retornado do Redis, sem custo adicional

### Rate Limit
```json
{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "resetAt": "2025-12-25T15:30:00.000Z"
    }
  }
}
```
**Significado:** Excedeu 100 req/min, aguarde até `resetAt`

### Headers de Rate Limit

Em toda response da API:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-12-25T15:30:00.000Z
```

## Debugging

### Ver logs do Redis

```bash
# Redis local
docker logs promptlab-redis-1

# Ou conecte diretamente
docker exec -it promptlab-redis-1 redis-cli

# Comandos úteis no redis-cli:
KEYS *                    # Ver todas as keys
GET gen:job:hash:abc123   # Ver valor cacheado
ZRANGE api-ratelimit:127.0.0.1 0 -1 WITHSCORES  # Ver requests
```

### Ver jobs no Prisma Studio

```bash
npx prisma studio --schema=./packages/db/prisma/schema.prisma
```

Navegue para "Job" e veja:
- `inputHash` - Hash usado para cache
- `estimatedCostUSD` - Custo da geração
- Status transitions

## Próximos Passos

Com Fase 7 completa, você pode:

1. **Adicionar OpenAI provider** (diversificar modelos)
2. **Implementar BullMQ** (queue production-grade)
3. **Criar UI Next.js** (interface visual)

Veja `RESUMO_SESSAO.md` para roadmap completo.

## Troubleshooting

### "Cache não está funcionando"

**Problema:** Requests duplicados não retornam `cached: true`

**Soluções:**
1. Certifique que Redis está rodando: `docker ps | grep redis`
2. Verifique logs da API: procure por "[API] Cache hit"
3. Verifique que job completou: `curl http://localhost:4000/jobs/{jobId}`

### "Rate limit muito agressivo"

**Problema:** Recebendo 429 rapidamente em testes

**Solução:** Ajuste o limite em `apps/api/src/index.ts`:
```typescript
rateLimitMiddleware({
  maxRequests: 1000,  // ← Aumente para testes
  windowSeconds: 60,
})
```

### "Worker não está cacheando"

**Problema:** Worker completa job mas não vê "Cached result" nos logs

**Soluções:**
1. Verifique que `job.inputHash` existe no log
2. Verifique Redis: `redis-cli GET gen:job:hash:xxx`
3. Reinicie worker: Ctrl+C e inicie novamente

## Performance Esperada

**Latências normais:**

| Operação | Tempo | Custo |
|----------|-------|-------|
| Cache hit | 10-50ms | $0 |
| Cache miss + DB | 100-200ms | $0 |
| LLM call (Haiku) | 5-8s | $0.001 |
| Rate limit check | 5-10ms | $0 |

**Se estiver vendo latências maiores:**
- Redis pode estar em outro host (network latency)
- Database pode estar lento (add indexes)
- LLM provider pode estar com latência alta

## Métricas para Monitorar

Em produção, você deveria trackear:

1. **Cache hit rate**: `hits / (hits + misses)`
   - Target: > 60% após warmup
   
2. **Rate limit rejections**: `429 responses / total requests`
   - Target: < 1% (apenas abuse real)

3. **Cost per request**: `total_cost / total_requests`
   - Target: < $0.0005 com cache

4. **P95 latency**: 
   - Cache hit: < 50ms
   - Cache miss: < 500ms

---

**🎉 Fase 7 está completa e funcional!**

Execute `./scripts/quick-start.sh` para validar tudo agora.
