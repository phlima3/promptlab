# 🎨 PromptLab Web UI

Interface web moderna construída com Next.js 14 (App Router) para o PromptLab.

## ✨ Features Implementadas

### 🏠 Homepage

- Dashboard com overview de métricas
- Links rápidos para templates e geração
- Estatísticas em tempo real

### 📝 Templates (`/templates`)

- **Listagem**: Visualize todos os templates disponíveis
- **Criação**: Formulário para criar novos templates
  - Nome do template
  - System prompt
  - User prompt com suporte a variáveis `{{variableName}}`
  - Versioning automático
- **Cards interativos**: Clique para usar na geração

### ⚡ Generate (`/generate`)

- **Seleção de template**: Interface visual para escolher template
- **Configuração**:
  - Provider (Anthropic Claude Haiku, OpenAI em breve)
  - Input dinâmico
- **Preview do template**: Veja system e user prompts antes de gerar
- **Feedback instantâneo**:
  - Cache hit notification
  - Redirecionamento automático para visualização do job

### 📊 Jobs (`/jobs`)

- **Listagem**: Todos os jobs com status em tempo real
- **Filters por status**: queued, running, completed, failed
- **Preview**: Input e output truncados nos cards
- **Métricas**: Custo e tokens quando disponível

### 🔍 Job Detail (`/jobs/[id]`)

- **Auto-refresh**: Polling automático para jobs em progresso
- **Status visual**: Badges coloridos e ícones
- **Métricas detalhadas**:
  - Tokens de entrada/saída
  - Custo estimado em USD
  - Timestamps (criado, iniciado, concluído)
- **Output completo**:
  - Copy button
  - Syntax highlighting
- **Error details**: Quando job falha

## 🎨 Design System

### Components

Todos os componentes seguem o padrão shadcn/ui com Tailwind CSS:

- **Button**: 5 variants (default, secondary, outline, ghost, destructive)
- **Card**: Container principal com header, content, footer
- **Badge**: Status indicators com 5 variants
- **Input/Textarea**: Form controls acessíveis
- **Label**: Form labels semânticos

### Dark Mode

- Suporte completo a dark mode
- Classes Tailwind com prefixo `dark:`
- Contraste otimizado para acessibilidade

### Colors

- **Zinc**: Base colors (background, text, borders)
- **Green**: Success states, cost savings
- **Red**: Error states
- **Yellow**: Warning states (running jobs)

## 🔧 Stack Técnica

### Core

- **Next.js 14**: App Router, Server Components
- **React 19**: Latest features
- **TypeScript**: Type safety end-to-end
- **Tailwind CSS 4**: Utility-first styling

### Data Fetching

- **@tanstack/react-query**: Client state management
- **Custom hooks**: `useTemplates`, `useJobs`, `useGenerate`
- **Auto-refetch**: Jobs em progresso atualizam a cada 2s

### Utilities

- **lucide-react**: Icons library
- **clsx + tailwind-merge**: Class composition
- **date-fns**: Date formatting

## 📁 Estrutura

```
apps/web/
├── app/
│   ├── layout.tsx                # Root layout com Providers
│   ├── page.tsx                  # Homepage
│   ├── providers.tsx             # React Query Provider
│   ├── templates/
│   │   └── page.tsx              # Templates CRUD
│   ├── generate/
│   │   └── page.tsx              # Generation form
│   └── jobs/
│       ├── page.tsx              # Jobs listing
│       └── [id]/
│           └── page.tsx          # Job detail
├── components/
│   ├── navigation.tsx            # Top navigation bar
│   └── ui/                       # Reusable components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── label.tsx
├── lib/
│   ├── api-client.ts             # API wrapper
│   ├── hooks.ts                  # React Query hooks
│   ├── types.ts                  # TypeScript types
│   └── utils.ts                  # Helper functions
└── .env.local                    # Environment variables
```

## 🚀 Como Usar

### 1. Configurar Ambiente

```bash
# No diretório apps/web
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 2. Instalar Dependências

```bash
cd apps/web
npm install
```

### 3. Iniciar Dev Server

```bash
npm run dev
```

A UI estará disponível em: http://localhost:3000

## 🔄 Fluxo de Uso

### Criar Template

1. Acesse `/templates`
2. Clique em "Novo Template"
3. Preencha nome, system prompt, user prompt
4. Use `{{variavel}}` para inputs dinâmicos
5. Salve

### Gerar Conteúdo

1. Acesse `/generate` ou clique em um template
2. Selecione o template desejado
3. Escolha o provider (Anthropic)
4. Digite o input
5. Clique em "Gerar Conteúdo"
6. Será redirecionado para a página do job

### Acompanhar Job

1. Na página do job, veja o status em tempo real
2. Jobs "queued" e "running" atualizam automaticamente
3. Quando completo, copie o output com um clique
4. Veja métricas de custo e tokens

## 💡 Próximas Melhorias

### Features

- [ ] Edição de templates
- [ ] Deleção de templates (com confirmação)
- [ ] Filtros e busca em jobs
- [ ] Paginação em listagens
- [ ] Bulk operations
- [ ] Favorites/bookmarks

### UX

- [ ] Toast notifications (sucesso/erro)
- [ ] Dark mode toggle manual
- [ ] Loading skeletons
- [ ] Empty states melhores
- [ ] Keyboard shortcuts

### Performance

- [ ] Infinite scroll em jobs
- [ ] Optimistic updates
- [ ] Suspense boundaries
- [ ] Image optimization

### Analytics

- [ ] Dashboard com gráficos
- [ ] Cost tracking por período
- [ ] Usage statistics
- [ ] Template popularity

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📊 Performance

### Métricas Target

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

### Otimizações Implementadas

- Server Components por padrão
- Client Components apenas quando necessário
- React Query cache (1 min staleTime)
- Lazy loading de rotas
- Tailwind CSS purging

## 🎯 Decisões de Design

### Por que React Query?

- Cache automático
- Background refetching
- Optimistic updates
- Error retry logic
- TypeScript support nativo

### Por que não usar Server Actions?

- Separação clara frontend/backend
- API REST reutilizável
- Rate limiting centralizado
- Cache Redis no backend

### Por que App Router?

- Server Components performance
- File-based routing
- Layout compartilhados
- Future-proof (Next.js direction)

---

**💬 Para discussão em code review:**

- Trade-offs de polling vs WebSockets
- Estratégia de cache (client + server)
- Error boundaries placement
- Form validation approach
