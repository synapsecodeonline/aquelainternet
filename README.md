# Aquela Internet

**A Internet no dia do seu aniversário.** Digite uma data e veja como estavam
Google, UOL, Globo, Wikipedia e mais — renderizados do acervo real do
[Wayback Machine](https://web.archive.org) (Internet Archive), sem nenhuma
interface do Wayback visível.

- 🌐 Produção: **https://aquelainternet.vercel.app**
- 📦 Código: https://github.com/tisomar/aquelainternet (deploy automático na Vercel)

## Funcionalidades

### Página inicial (`/`)

- Seletor de data (padrão: hoje − 10 anos), botão "Me surpreenda" e atalhos
  para datas icônicas: 07/07/2014, 11/09/2001, 15/03/2020 e 01/01/2000.
- Campo de **busca por site específico** (ex.: `uol.com.br`, `facebook.com`).
- Link para **`/aniversario`**: input de data de nascimento que leva direto
  ao resultado ("como era a internet quando você nasceu").
- Link para **`/comparar`**: escolhe duas datas e mostra as capturas lado a
  lado (`/comparar?a=AAAA-MM-DD&b=AAAA-MM-DD`), com cards compactos.

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
  `og:image` (preview automático no WhatsApp/Instagram/Twitter). Mostra
  **4 sites em tiles 2×2 grandes** — o conteúdo da página é o protagonista.
- Variante **Stories 1080×1920** via `?format=story` (`/card?format=story`),
  com **6 sites em 2 colunas × 3 linhas** e tipografia maior — botão
  "📱 Baixar Stories" na tela de share.
- Cada quadrado do card contém o **screenshot real** (800px) da página
  arquivada. Providers em cadeia: **thum.io → Microlink** (GIF é rejeitado
  pois o Satori não o suporta).
- O card **só é gerado com todas as imagens**: até 3 rodadas de retry por
  thumbnail; se alguma falhar, a rota retorna **503** (`Retry-After: 30`)
  em vez de emitir card incompleto. Cache de 1h (nunca `immutable`).
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
| `GET /[date]/card` | PNG 1200×630 do card |

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

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Cheerio ·
`next/og` (ImageResponse) · Supabase · thum.io (screenshots) · Docker

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

## Banco de dados

Migration em `supabase/migrations/001_snapshots.sql` — já aplicada em
produção. RLS habilitado: leitura pública (anon), escrita só via service role.

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
app/                 rotas: /, /aniversario, /[date], /[date]/share,
                     /[date]/card, /api/*
components/          SiteGrid, SiteCard, DatePicker, ShareCard, ErrorState,
                     AnniversaryForm, …
lib/                 wayback.ts, cache.ts, search.ts, sites.ts, date.ts,
                     era.ts, parse-headline.ts, site.ts, supabase.ts
lib/__tests__/       testes Vitest (19 testes)
types/               tipos compartilhados (DayResult etc.)
supabase/migrations/ 001_snapshots.sql
scripts/             test-wayback.ts
prompt-*.md          especificação original do projeto (raiz)
```

## Limitações conhecidas

- Screenshot usa serviços gratuitos (thum.io + mShots) — se ambos falharem,
  a rota retorna 503 e o usuário pode tentar de novo. mShots pode demorar
  alguns segundos na primeira renderização de cada URL.
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
- [x] Página `/aniversario` com data de nascimento
- [x] Testes automatizados (Vitest, 19 testes em `lib/__tests__/`)
- [x] Fallback de screenshot (thum.io → Microlink; GIF rejeitado)
- [x] Comparação de duas datas (`/comparar?a=…&b=…`, cards compactos)
- [ ] Self-hosted screenshot (Playwright) se os gratuitos virarem gargalo
