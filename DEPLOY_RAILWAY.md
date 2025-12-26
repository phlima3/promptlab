# 🚀 Deploy PromptLab no Railway + Neon

Guia completo para fazer deploy da API do PromptLab no Railway com banco Neon PostgreSQL.

---

## 📋 Índice

1. [Setup Banco Neon](#1-setup-banco-neon) (5 minutos)
2. [Deploy no Railway](#2-deploy-no-railway) (10 minutos)
3. [Comandos Úteis](#3-comandos-úteis)
4. [Troubleshooting](#4-troubleshooting)

---

## 1️⃣ Setup Banco Neon

### Criar Banco

1. Acesse [console.neon.tech](https://console.neon.tech)
2. Clique em **"Create Project"**
3. Configure:
   - **Name**: `promptlab`
   - **Region**: Escolha a mais próxima
   - **Postgres Version**: 16
4. Clique em **"Create Project"**

### Copiar Connection String

Você verá algo como:

```
postgresql://user:password@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Copie essa URL completa!**

### Configurar Localmente

```bash
# Criar .env na raiz do projeto
cp .env.example .env

# Edite .env e cole sua URL do Neon:
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

### Rodar Migrations e Seeds

```bash
# Instalar dependências
npm install

# Rodar migrations (cria tabelas)
cd packages/db
npm run prisma:migrate
# Quando perguntar o nome: "init"

# Popular banco com dados de exemplo
npm run seed

# Verificar (abre Prisma Studio)
npm run prisma:studio
```

✅ **Pronto!** Banco Neon configurado e funcionando!

---

## 2️⃣ Deploy no Railway

### Opção A: Via GitHub (Recomendado)

#### Passo 1: Push do Código

```bash
git add .
git commit -m "feat: setup for Railway deploy"
git push origin main
```

#### Passo 2: Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Escolha **"Deploy from GitHub repo"**
5. Selecione o repositório `promptlab`

#### Passo 3: Configurar o Serviço

No Railway, clique em **"Settings"** (engrenagem) e configure:

- **Root Directory**: `/apps/api`
- **Build Command**: `./scripts/railway-build.sh`
- **Start Command**: `./scripts/railway-start.sh`

#### Passo 4: Adicionar Variáveis de Ambiente

Clique em **"Variables"** e adicione:

```bash
# Database (USE A MESMA URL DO NEON!)
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require

# Obrigatórias
NODE_ENV=production
JWT_SECRET=GERE-UM-SECRET-ALEATORIO-DE-32-CARACTERES-OU-MAIS

# Pelo menos uma chave de LLM
ANTHROPIC_API_KEY=sk-ant-...
# OU
OPENAI_API_KEY=sk-...

# Opcional mas recomendado
REDIS_URL=redis://localhost:6379

# Quando tiver frontend em produção
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

**💡 Dica para gerar JWT_SECRET:**

```bash
openssl rand -base64 32
```

#### Passo 5: Deploy!

1. Clique em **"Deploy"**
2. Aguarde o build e deploy (2-3 minutos)
3. Quando terminar, clique em **"Settings"** → **"Generate Domain"**
4. Copie a URL (ex: `https://promptlab-production.up.railway.app`)

#### Passo 6: Testar

```bash
# Defina sua URL
export API_URL="https://seu-projeto.railway.app"

# Health check (deve retornar: {"status":"ok"})
curl $API_URL/health

# Listar templates
curl $API_URL/templates

# Ver documentação (abra no navegador)
open $API_URL/api-docs
```

✅ **Deploy concluído!** Sua API está no ar! 🎉

---

### Opção B: Adicionar Redis (Opcional)

Para rate limiting e cache de verdade:

1. No Railway, clique em **"New"** → **"Database"** → **"Redis"**
2. Railway criará um Redis automaticamente
3. Copie a `REDIS_URL` das variáveis do Redis
4. Cole no serviço da API (aba Variables)
5. Redeploy (se necessário)

---

## 3️⃣ Comandos Úteis

### Railway CLI

```bash
# Instalar
npm i -g @railway/cli

# Login
railway login

# Linkar projeto
railway link

# Ver logs em tempo real
railway logs --tail

# Ver logs de erro apenas
railway logs --level error

# Abrir dashboard
railway open

# Executar comando remoto
railway run npx prisma migrate deploy

# Adicionar variável
railway variables set KEY=VALUE

# Ver todas as variáveis
railway variables
```

### Testar API

```bash
# Health check
curl https://seu-app.railway.app/health

# Criar template
curl -X POST https://seu-app.railway.app/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Template",
    "systemPrompt": "You are helpful",
    "userPrompt": "Say: {{input}}",
    "variablesSchema": {"input": "string"}
  }'

# Listar templates
curl https://seu-app.railway.app/templates
```

### Database (Migrations)

```bash
# Rodar migrations no Railway
railway run cd packages/db && npx prisma migrate deploy

# Ver status das migrations
railway run cd packages/db && npx prisma migrate status

# Abrir Prisma Studio (conectado ao Railway)
railway run cd packages/db && npx prisma studio
```

### Redeploy

```bash
# Fazer mudanças e commit
git add .
git commit -m "fix: alguma coisa"
git push origin main

# Railway redeploya automaticamente!
```

---

## 4️⃣ Troubleshooting

### ❌ Build falhou

**Erro: "Cannot find module"**

**Solução**:

```bash
# Verifique Root Directory nas Settings
Root Directory: /apps/api

# Verifique Build Command
Build Command: ./scripts/railway-build.sh
```

**Erro: "Permission denied: railway-build.sh"**

**Solução**:

```bash
chmod +x scripts/railway-build.sh scripts/railway-start.sh
git add scripts/*.sh
git commit -m "fix: make scripts executable"
git push
```

---

### ❌ Runtime Errors

**Erro: "Cannot connect to database"**

**Soluções**:

1. Verifique a DATABASE_URL:

   ```bash
   railway variables | grep DATABASE_URL
   ```

2. Certifique-se que tem `?sslmode=require`:

   ```
   postgresql://user:pass@host/db?sslmode=require
   ```

3. Teste localmente com a mesma URL:
   ```bash
   export DATABASE_URL="postgresql://..."
   cd packages/db
   npx prisma db pull
   ```

**Erro: "Migration failed"**

**Solução**:

```bash
# Via Railway CLI
railway link
railway run cd packages/db && npx prisma migrate deploy

# Ou force redeploy no dashboard
# Settings → Deploy Triggers → Redeploy
```

**Erro: "CORS policy blocked"**

**Solução**:

```bash
# Adicione a URL do frontend
railway variables set ALLOWED_ORIGINS="https://seu-frontend.vercel.app"

# Múltiplas URLs (separadas por vírgula)
railway variables set ALLOWED_ORIGINS="https://app1.com,https://app2.com"
```

**Erro: "JWT must be provided"**

**Solução**:

```bash
# Gere e adicione JWT_SECRET
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
```

---

### ❌ Performance Issues

**API muito lenta**

**Possíveis causas**:

- Neon em região distante
- Cold start (banco dormindo)
- Sem Redis

**Soluções**:

```bash
# 1. Adicione Redis
railway add  # Escolha Redis

# 2. Use URL com pooling do Neon
# (deve conter -pooler.neon.tech)

# 3. Verifique logs de performance
railway logs --tail | grep -i "ms"
```

**Neon "Auto-sleep"**

- **Free tier**: Banco dorme após inatividade (primeiros requests ~1-2s)
- **Solução**: Aceite o cold start ou upgrade para Neon Pro

---

### ❌ Deploy Issues

**Deploy fica "em progresso" forever**

**Solução**:

1. Cancele o deploy no dashboard
2. Veja os logs:
   ```bash
   railway logs --deployment [deployment-id]
   ```
3. Force redeploy limpo:
   ```bash
   railway redeploy --clean
   ```

**Funciona local mas falha no Railway**

**Debug**:

```bash
# 1. Compare variáveis
railway variables
cat .env

# 2. Teste build local
./scripts/railway-build.sh

# 3. Verifique Node version
railway run node --version
```

---

### ❌ Redis Issues

**"Redis connection refused"**

**Solução**:

```bash
# 1. Verifique se Redis existe
railway services

# 2. Se não tem, adicione
railway add  # Escolha Redis

# 3. Pegue a URL
railway variables --service redis

# 4. Configure na API
railway variables set REDIS_URL="redis://..."
```

**API funciona sem Redis?**

**Sim!** Redis é opcional no MVP. Para desabilitar:

```bash
railway variables delete REDIS_URL
```

---

## 📊 Checklist de Production-Ready

Antes de considerar pronto para produção:

- [ ] `NODE_ENV=production` configurado
- [ ] `JWT_SECRET` aleatório e seguro (32+ caracteres)
- [ ] `DATABASE_URL` do Neon com `?sslmode=require`
- [ ] `ALLOWED_ORIGINS` com URL do frontend
- [ ] Redis configurado (recomendado)
- [ ] Migrations rodadas com sucesso
- [ ] Health check retorna `{"status":"ok"}`
- [ ] CORS configurado corretamente
- [ ] `/api-docs` acessível
- [ ] Logs sem erros críticos
- [ ] Endpoints testados (templates, generate, jobs)

---

## 🔗 Conectar Frontend

Após deploy da API, configure o frontend:

```bash
# No .env do Next.js (apps/web)
NEXT_PUBLIC_API_URL=https://seu-projeto.railway.app

# Deploy no Vercel
vercel --prod

# Adicione URL do frontend no Railway
railway variables set ALLOWED_ORIGINS="https://seu-frontend.vercel.app"
```

---

## 🎯 Próximos Passos

1. **Deploy do Worker** (mesmo processo):

   - Root Directory: `/apps/worker`
   - Mesmas variáveis de ambiente
   - Processa jobs em background

2. **Monitoramento**:

   - Sentry para error tracking
   - Logs estruturados
   - Métricas de performance

3. **CI/CD**:
   - GitHub Actions
   - Testes automatizados
   - Deploy automático

---

## 💰 Custos

### Free Tier

- **Railway**: $5 USD/mês de crédito (~500h execução)
- **Neon**: 0.5 GB storage, 1 projeto
- **Total**: **$0** para MVP/desenvolvimento! 🎉

### Paid Plans (quando escalar)

- **Railway**: Pay-as-you-go após créditos ($0.000463/GB-hour)
- **Neon Pro**: $19/mês (mais storage, sem auto-sleep)

---

## 📚 Recursos

- [Railway Docs](https://docs.railway.app/)
- [Railway + Prisma](https://docs.railway.app/guides/prisma)
- [Railway Discord](https://discord.gg/railway)
- [Neon Docs](https://neon.tech/docs)
- [Prisma + Neon](https://www.prisma.io/docs/guides/database/neon)

---

## 🆘 Último Recurso

Se nada funcionar:

1. **Veja os logs primeiro**: `railway logs --tail`
2. **Check status do Railway**: [status.railway.app](https://status.railway.app)
3. **Check status do Neon**: Operations no [console.neon.tech](https://console.neon.tech)
4. **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
5. **Delete e recrie** (último caso):
   ```bash
   railway project delete
   railway init
   ```

---

**Sucesso no deploy!** 🚀

Se encontrar algum problema não coberto aqui, veja os logs primeiro com `railway logs --tail` - eles geralmente têm a resposta! 📋
