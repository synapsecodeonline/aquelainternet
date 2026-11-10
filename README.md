# Aquela Internet

**A Internet no dia do seu aniversário.** Digite uma data e veja como estavam
Google, UOL, Globo, Wikipedia e mais — renderizados do acervo real do
[Wayback Machine](https://web.archive.org) (Internet Archive), sem nenhuma
interface do Wayback visível.

- 🌐 Produção: **https://aquelainternet.vercel.app**
- 📦 Código: https://github.com/tisomar/aquelainternet (deploy automático na Vercel)

## Arquitetura

```
Usuário ──► Vercel (Next.js 14)
              │
              ├─ /api/* ──► Supabase (Postgres)  ← cache persistente de snapshots
              │         └─► Wayback Machine CDX  ← fonte real dos dados
              │
              ├─ /[date]/card ──► thum.io / Microlink  ← screenshots p/ PNG
              │
              └─ /api/cron/daily ◄── Vercel Cron (12h, warm-up)
                                    n8n no Render (12h e 20h) ──► Instagram Graph API
```

| Peça | Serviço | Plano |
|---|---|---|
| App Next.js (páginas + APIs + cards PNG) | Vercel | Hobby (grátis) |
| Cache persistente (`snapshots`) | Supabase | Free |
| Dados históricos | Internet Archive Wayback Machine | público |
| Screenshots das páginas | thum.io → Microlink (fallback) | free tiers |
| Agendador de posts | n8n em Docker no Render | Free |
| Post no Instagram | Meta Graph API | — |

## Funcionalidades

### Página inicial (`/`)

- Seletor de data (padrão: hoje − 10 anos), botão "Me surpreenda" e atalhos
  para datas icônicas: 07/07/2014, 11/09/2001, 15/03/2020 e 01/01/2000.
- Campo de **busca por site específico** (ex.: `uol.com.br`, `facebook.com`).
- Link para **`/aniversario`**: input de data de nascimento que leva direto
  ao resultado ("como era a internet quando você nasceu").
- Link para **`/comparar`**: digite um domínio + duas datas e veja a
  captura válida mais próxima de cada data lado a lado
  (`/comparar?site=DOMINIO&a=AAAA-MM-DD&b=AAAA-MM-DD`, janela ±30 dias).

### Página de resultado (`/[date]`)

- Grade responsiva com até 10 cards, **somente capturas do dia exato**
  pesquisado (via CDX `from=to=data`). Sem cards "sem registro" — se não há
  captura real, o site simplesmente não aparece.
- Lista curada com **23 portais** (17 brasileiros: UOL, Globo, BOL, Folha,
  Estadão, Abril, Terra, iG, R7, Exame, Meio Bit, UAI, TecMundo, Canaltech,
  Olhar Digital, CNN Brasil, Metrópoles + internacionais: Google, YouTube,
  Wikipedia, Yahoo, MSN, GeoCities), filtrados por era. Redes sociais com
  login ficam de fora.
- Cada card exibe: iframe da página arquivada (modo `if_`, sem toolbar do
  Wayback), data do snapshot, nome do site, manchete extraída do HTML
  (h1 → og:title → title → meta description), link para abrir o snapshot
  completo e spinner próprio até o iframe carregar.
- A cada visita, o servidor **sorteia uma amostra de até 16 sites** da lista
  elegível — datas revisitadas mostram combinações diferentes de portais, e
  a primeira carga fica mais rápida. O cache é por `(site, data)`, então os
  sites sorteados vão se acumulando no Supabase.
- Seleção de sites **aleatória no navegador**: no máximo 10 cards por vez,
  sempre sites diferentes (nunca repete). O botão **"🔀 Novas sugestões"**
  sorteia um subconjunto diferente de sites a cada clique, sem recarregar
  (vale também na busca por site e nas colunas de `/comparar`).
- Selo de era ("A febre do Orkut", "Pré-história da internet"…) e destaque
  "📰 Manchete do dia" (escolha determinística por data).
- Validação de conteúdo: páginas estacionadas (DomainValet, Sedo…), páginas
  de erro do Wayback e HTML vazio são rejeitadas — só entra o que tem
  conteúdo real.
- Somente **portais** na busca geral; redes sociais com login
  (Facebook, Twitter/X, Instagram, Orkut) ficam de fora porque sempre caem
  na tela de login — mas aparecem normalmente na **busca por URL**.

### Busca por site (`/[date]?site=dominio.com`)

- Retorna até 10 capturas reais do host na janela de ±30 dias, amostradas ao
  longo do período, deduplicadas por timestamp e validadas por conteúdo.
- Aceita páginas de login (diferente da busca geral).
- Capturas fora do dia exato exibem selo `fora da data` (âmbar com ⚠ se o
  desvio passar de 30 dias).

### Card para compartilhar (`/[date]/card`, `/[date]/share`)

- PNG **1200×630** gerado com `next/og` (`ImageResponse`), usado também como
  `og:image` (preview automático no WhatsApp/Instagram/Twitter). No feed,
  **6 sites em linhas compactas** (2 colunas × 3 linhas), cada um com
  **thumbnail quadrado 104×104** + nome, data do snapshot e manchete.
- Variante **Stories 1080×1920** via `?format=story` (`/card?format=story`),
  com **6 sites em tiles grandes 2×3** e tipografia maior — botão
  "📱 Baixar Stories" na tela de share.
- Cada imagem do card contém o **screenshot real** (800px) da página
  arquivada. Providers em cadeia: **thum.io → Microlink** (GIF é rejeitado
  pois o Satori não o suporta).
- O card **só é gerado com todas as imagens**: até 2 rodadas de retry por
  thumbnail; se alguma falhar, a rota retorna **503** (`Retry-After: 30`)
  em vez de emitir card incompleto. Cache de 1h (nunca `immutable`) +
  cache em memória de thumbnails (~50min).
- Na tela de share, os botões **Baixar PNG**, **Baixar Stories** e
  **Compartilhar** ficam desabilitados até o PNG terminar de carregar;
  quando tudo carrega, exibe **"✅ Todos os cards foram carregados!"**.
  Erro mostra retry com cache busting (`?v=`).
- Botão **Copiar legenda** gera legenda pronta para Instagram com a data por
  extenso, os sites do dia e link com **UTM** (`utm_source=instagram`) para
  medir a origem do tráfego.

## APIs

| Endpoint | Descrição |
|---|---|
| `GET /api/snapshot?url=&date=` | Snapshot mais próximo válido de um site em uma data |
| `GET /api/day?date=` | Todos os portais com captura no dia (JSON) |
| `GET /api/site?url=&date=` | Até 10 capturas de um site arbitrário (±30 dias) |
| `GET /[date]/card` | PNG 1200×630 do card (`?format=story` = 1080×1920) |
| `GET /api/cron/daily` | Endpoint do agendador: sorteia data + gera card (+ posta no IG se configurado). Auth: `Authorization: Bearer $CRON_SECRET`. `?dry=1` retorna só o JSON |

## Como o Wayback é consultado (`lib/wayback.ts`)

1. **CDX API** com `from`=`to`=data exata (busca geral) ou janela ±30 dias
   (busca por site), status 200, dedup por digest.
2. **HTML bruto** (`id_`) baixado uma vez por candidato e validado:
   tamanho mínimo, blacklist de páginas estacionadas/erro.
3. **Manchete** extraída com Cheerio (h1 → og:title → title → meta).
4. Regras de proteção: User-Agent customizado, timeout de 8s, intervalo
   mínimo de 500ms entre chamadas ao archive.org.

## Cache (`lib/cache.ts`)

- **Supabase** (tabela `snapshots`, chave única `site_slug + requested_date`)
  quando as env vars estão configuradas — cache persistente entre deploys e
  instâncias serverless.
- **Memória** como fallback (funciona, mas zera a cada cold start).
- Leituras quentes respondem em ~100ms; consultas frias levam ~10–60s
  (serializadas pelo throttle de 500ms do Wayback) — a UI mostra loading
  global e por card durante esse período.
- **Resultados negativos expiram em 10 min** (não 30 dias): se o Wayback
  falhar numa rajada de consultas, os `available: false` não envenenam o
  cache — a data se recupera sozinha na próxima visita. Snapshots reais
  continuam válidos por 30 dias (anos passados não mudam).

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Cheerio ·
`next/og` (ImageResponse) · Supabase · thum.io + Microlink (screenshots) ·
Vitest · Docker · Vercel (hosting + Cron) · n8n no Render (automação)

## Como rodar local

```bash
npm install
cp .env.example .env   # opcional — sem Supabase usa cache em memória
npm run dev            # http://localhost:3000
```

Com Docker:

```bash
docker compose up --build
```

A imagem é Next.js standalone multi-stage (`node:20-alpine`, non-root).

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | não | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | não | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | não | Chave service role (escrita, bypass RLS) |
| `NEXT_PUBLIC_SITE_URL` | não | URL pública do site (og:image, canonical, UA). Default: `https://aquelainternet.vercel.app` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | não | Rate limit opcional |
| `CRON_SECRET` | não | Secret do `/api/cron/daily` (Vercel Cron e n8n) |
| `IG_ACCESS_TOKEN` | não | Token Graph API — modo post direto do endpoint (o n8n usa as próprias envs dele) |
| `IG_USER_ID` | não | ID da conta Instagram Business (idem) |

## Banco de dados

Migration em `supabase/migrations/001_snapshots.sql` — já aplicada em
produção. RLS habilitado: leitura pública (anon), escrita só via service role.

## Post automático no Instagram (n8n + Render)

O agendamento de posts é feito por um workflow **n8n** hospedado no
**Render** (plano free). O n8n roda **2x ao dia (12h e 20h)** e, a cada
execução:

1. Chama `GET /api/cron/daily?dry=1` com `Authorization: Bearer
   $CRON_SECRET` → recebe `{ date, cardUrl, sites, caption }` (data
   sorteada + URL pública do card PNG + legenda pronta)
2. `POST /{IG_USER_ID}/media` na Graph API → cria o container com
   `image_url` + `caption`
3. `POST /{IG_USER_ID}/media_publish` → publica no feed

O arquivo de importação está em **`n8n/instagram-posts.json`**.

### Deploy do n8n no Render (gratuito)

1. https://render.com → login → **New → Web Service → Existing Image**
2. **Image URL**: `n8nio/n8n:latest` (ou versão fixa, ex.: `n8nio/n8n:1.81.4`)
3. **Name**: `aquelainternet-n8n` → a URL fica
   `https://aquelainternet-n8n.onrender.com`
4. **Plan**: Free
5. **Environment** — cole as variáveis (template em `.env.n8n`, que é
   git-ignored por conter a encryption key):

   ```
   N8N_HOST=aquelainternet-n8n.onrender.com
   N8N_PROTOCOL=https
   WEBHOOK_URL=https://aquelainternet-n8n.onrender.com/
   N8N_ENCRYPTION_KEY=<string aleatória de 32+ chars — gere uma vez e guarde>
   GENERIC_TIMEZONE=America/Sao_Paulo
   TZ=America/Sao_Paulo
   N8N_PORT=10000
   PORT=10000
   N8N_PROXY_HOPS=1
   NODE_ENV=production
   CRON_SECRET=<mesmo valor configurado na Vercel>
   IG_ACCESS_TOKEN=<token da Graph API>
   IG_USER_ID=<id da conta Instagram Business>
   ```

6. Deploy → abrir a URL → **Quick setup** (criar owner) →
   **Workflows → Import from File** → `n8n/instagram-posts.json` →
   **Activate** (toggle).

### Keep-alive (plano free dorme após ~15min sem tráfego)

Workflows agendados não disparam com a instância dormindo. Solução
gratuita: criar um monitor HTTP em **cron-job.org** ou **UptimeRobot**
pingando `https://aquelainternet-n8n.onrender.com/healthz` a cada 5min.

### Credenciais do Instagram

Pré-requisitos: conta **Instagram Business/Creator** vinculada a uma
página do Facebook + app no
[Meta for Developers](https://developers.facebook.com/) com os escopos
`instagram_basic` e `instagram_content_publish`. O token e o ID da conta
(`GET /me/accounts` → conta IG vinculada) vão **somente nas env vars do
n8n** — não configurar `IG_*` na Vercel, senão o Vercel Cron postaria em
duplicidade ao meio-dia (ele serve como aquecimento de cache do card das
12h, já que roda no mesmo horário).

## Deploy

- **Vercel + GitHub (automático)**: push na `master` → build e deploy em
  produção (~1min); outras branches viram previews.
- Configuração: projeto `tisomars-projects/aquelainternet`, env vars do
  Supabase cadastradas em Production.
- Domínio customizado: adicionar em Vercel → Settings → Domains e definir
  `NEXT_PUBLIC_SITE_URL` com o novo domínio.

## Testes

```bash
npx tsx scripts/test-wayback.ts   # integração Wayback (3 sites × 3 datas)
npm test                          # Vitest: date, wayback helpers, headlines, eras
npm run build                     # lint + typecheck + build
```

Verificações manuais úteis:

```bash
curl "https://aquelainternet.vercel.app/api/day?date=2014-07-07"
curl -o card.png "https://aquelainternet.vercel.app/2014-07-07/card"  # 1200×630 PNG
```

## Estrutura

```
app/                 rotas: /, /aniversario, /comparar, /[date],
                     /[date]/share, /[date]/card, /api/* (+ loading.tsx)
components/          SiteGrid, SiteCard, DatePicker, ShareCard, ErrorState,
                     AnniversaryForm, CompareForm, RandomDateLink, …
lib/                 wayback.ts, cache.ts, search.ts, sites.ts, date.ts,
                     era.ts, parse-headline.ts, site.ts, supabase.ts
lib/__tests__/       testes Vitest (19 testes)
types/               tipos compartilhados (DayResult, SnapshotRecord…)
supabase/migrations/ 001_snapshots.sql
n8n/                  instagram-posts.json — workflow de posts 2x/dia
scripts/             test-wayback.ts
.env.n8n             template de env vars do n8n (git-ignored)
vercel.json          Vercel Cron diário (warm-up do card das 12h)
prompt-*.md          especificação original do projeto (raiz)
```

## Limitações conhecidas

- Screenshot usa serviços gratuitos (thum.io → Microlink) — se ambos
  falharem, a rota retorna 503 e o usuário pode tentar de novo.
- Capturas do Wayback são irregulares: dias com pouco crawl mostram poucos
  (ou nenhum) cards — comportamento esperado, não bug.
- A busca por site cobre apenas o host exato (sem subpáginas), pois
  `matchType=host/prefix` do CDX estoura timeout.
- URLs `if_` reescrevem assets/links, mas páginas muito antigas podem ter
  assets quebrados — é parte do charme.

## Roadmap / ideias

- [ ] Domínio próprio (`aquelainternet.com`) + `NEXT_PUBLIC_SITE_URL`
- [ ] Rotacionar as chaves do Supabase (foram expostas em chat)
- [x] UTM nas legendas para medir origem Instagram/WhatsApp
- [x] Card Stories 1080×1920 (`?format=story`)
- [x] Card feed compacto: 6 sites com thumbnails quadrados
- [x] Página `/aniversario` com data de nascimento
- [x] Testes automatizados (Vitest, 19 testes em `lib/__tests__/`)
- [x] Fallback de screenshot (thum.io → Microlink; GIF rejeitado)
- [x] Comparação do mesmo site em duas datas (`/comparar?site=…&a=…&b=…`)
- [x] Workflow n8n de posts 2x/dia (`n8n/instagram-posts.json`)
- [ ] Credenciais do Instagram (`IG_ACCESS_TOKEN` + `IG_USER_ID`) → ativar posts
- [ ] Keep-alive do n8n no Render (cron-job.org/UptimeRobot)
- [ ] Self-hosted screenshot (Playwright) se os gratuitos virarem gargalo
