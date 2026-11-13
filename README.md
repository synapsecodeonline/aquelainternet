# Aquela Internet

**A Internet no dia do seu aniversário.** Digite uma data e veja como estavam
Google, UOL, Globo, Wikipedia e mais — renderizados do acervo real do
[Wayback Machine](https://web.archive.org) (Internet Archive), sem nenhuma
interface do Wayback visível.

- 🌐 Produção: **https://aquelainternet.vercel.app**
- 📦 Código: https://github.com/synapsecodeonline/aquelainternet (deploy automático na Vercel)

## Arquitetura

```
Usuário ──► Vercel (Next.js 14)
              │
              ├─ /api/* ──► Supabase (Postgres)  ← cache persistente de snapshots
              │         └─► Wayback Machine CDX  ← fonte real dos dados
              │
              ├─ /[date]/card, /buscar/card ──► thum.io / Microlink  ← screenshots p/ PNG
              │
              └─ /api/cron/daily ◄── automação externa (Python, cron local,
                                    GitHub Actions…) ──► redes sociais
```

| Peça | Serviço | Plano |
|---|---|---|
| App Next.js (páginas + APIs + cards PNG) | Vercel | Hobby (grátis) |
| Cache persistente (`snapshots`) | Supabase | Free |
| Dados históricos | Internet Archive Wayback Machine | público |
| Screenshots das páginas | thum.io → Microlink (fallback) | free tiers |
| Agendador de posts | script Python local / cron | — |

## Funcionalidades

### Página inicial (`/`)

- `DatePicker`: campo de data (começa **vazio**) + campo de domínio.
  Três combinações:
  - **Só data** → `/{data}` — sorteia portais aleatórios do dia.
  - **Data + domínio** → `/{data}?site=dominio` — ver regras de busca abaixo.
  - **Só domínio** → `/buscar?site=dominio` — o site através do tempo.
- Botão **"🎲 Me surpreenda"**: data aleatória entre 2003 e hoje.
- Links para **`/aniversario`** e **`/comparar`**.

### Aniversário (`/aniversario`)

- Input de data de nascimento com preview ("Você tinha X anos — era a fase Y").
- Botão **"🕰️ Ver minha internet"** → `/{data}` com a data preenchida:
  a página sorteia uma **amostra de até 20 portais** elegíveis naquela data
  e mostra só os que têm captura real — a pessoa vê vários portais e as
  notícias/manchetes do dia dela. A cada visita a amostra é diferente.

### Página de resultado (`/[date]`)

- Grade responsiva com os cards dos portais sorteados, **somente capturas
  do dia exato** pesquisado (CDX `from=to=data`). Sem cards "sem registro" —
  se não há captura real, o site simplesmente não aparece.
- Lista curada com **~30 portais de notícias brasileiros** filtrados por
  era: UOL, Globo, BOL, Folha, Estadão, Abril, VEJA, IstoÉ, Época,
  CartaCapital, Valor, Extra, G1, Terra, iG, R7, Exame, Meio Bit, UAI,
  Tecnoblog, Adrenaline, TecMundo, Canaltech, TechTudo, Olhar Digital, CNN
  Brasil, Metrópoles, Nexo, The Intercept, Brasil 247.
  **A busca geral é só BR e só notícias** — internacionais (BBC, NYT,
  Reuters…), não-notícias (Google, YouTube, Wikipedia, Yahoo, MSN,
  GeoCities) e redes sociais com login (Orkut, Facebook, Twitter/X,
  Instagram) ficam como `nonNews`/`loginWall`: fora da busca geral, mas
  pesquisáveis digitando o domínio em `?site=`.
- Cada card exibe: iframe da página arquivada (modo `if_`, sem toolbar do
  Wayback), data do snapshot, nome do site, **até 4 chamadas de matéria
  reais** extraídas do HTML (h1–h3 + links de headline, sem o nome do
  site — fallback: h1 → og:title → title → meta description), link para
  abrir o snapshot completo e spinner próprio até o iframe carregar.
- A cada visita, o servidor **sorteia uma amostra de até 20 sites** da lista
  elegível — datas revisitadas mostram combinações diferentes de portais, e
  a primeira carga fica mais rápida. O cache é por `(site, data)`, então os
  sites sorteados vão se acumulando no Supabase.
- Seleção de sites **aleatória no navegador**: no máximo 10 cards por vez,
  sempre sites diferentes (nunca repete). O botão **"🔀 Novas sugestões"**
  sorteia um subconjunto diferente de sites a cada clique, sem recarregar
  (vale também na busca por site e nas colunas de `/comparar`).
- **Filtro por assunto ao vivo**: campo "Filtrar por assunto…" acima da
  grade casa o termo (sem acentos/maiúsculas) contra manchete, nome do
  site e URL de cada card — ex.: `política`, `tech`, `futebol`. Funciona
  em busca geral, busca por site e `/comparar`.
- Selo de era ("A febre do Orkut", "Pré-história da internet"…) e banner
  **"📰 Manchetes do dia"** (escolha determinística por data).
- Validação de conteúdo: páginas estacionadas (DomainValet, Sedo…), páginas
  de erro do Wayback e HTML vazio são rejeitadas — só entra o que tem
  conteúdo real.
- O botão **"🎲 Outra data"** preserva os parâmetros de pesquisa — numa
  busca por site (`?site=`), a nova data continua buscando o mesmo site.
- Botões de ação: **"📸 Gerar card pra compartilhar"** (todas as telas com
  cards), **"🎲 Outra data"** e **"🔗 Copiar link"**.

### Busca data + domínio (`/[date]?site=dominio.com`)

Regra implementada em `app/[date]/page.tsx` com `lib/search.ts`:

- **Captura NO DIA EXATO** (`findExactSiteRecord`, CDX `from=to=data`)
  → **1 card só**, com a captura daquele portal naquele dia.
- **Sem captura no dia exato** → **vários cards do mesmo domínio em datas
  próximas** (`searchSiteWindow`, janela de ±30 dias, até 8 capturas
  validadas). Título vira "dominio.com em datas próximas" e cada card
  mostra selo **"Fora da data pesquisada"** com a distância em dias.
- **Sem nenhuma captura em ±30 dias** → aviso de que o site não tem
  capturas no acervo.
- Capturas de login são aceitas (diferente da busca geral).
- O botão de share respeita o caso: captura exata → `/{data}/share?site=`;
  fallback → `/buscar/share?site=&date=` (mesma janela, card do registro
  exibido).

### Timeline do domínio (`/buscar?site=dominio.com`)

- Domínio **sem data** → o site "através do tempo": uma captura por época,
  em âncoras espaçadas ~3 anos (2002→hoje), cada card com a data da sua
  própria captura (`searchSiteTimeline` + `closestSnapshotRecord`).

### Comparação (`/comparar?site=…&a=…&b=…`)

- Digite um domínio + duas datas válidas e veja a **captura válida mais
  próxima de cada data** (janela ±30 dias, `findClosestSiteRecord`) lado a
  lado, cada coluna com nome da era. Aceita hosts arbitrários, inclusive
  `nonNews`/`loginWall`.
- Não tem botão de card para compartilhar (decisão de produto).

### Cards para compartilhar

Rotas de imagem (`next/og` → `ImageResponse`):

| Rota | O que gera |
|---|---|
| `GET /[date]/card` | Card da data (sorteio determinístico por hash da data). `?site=<domínio>` força um portal: captura exata do dia ou janela ±30d. `?format=feed` = versão wide |
| `GET /buscar/card` | Card do domínio. `?site=` obrigatório; `?date=AAAA-MM-DD` fixa o dia; `?ts=YYYYMMDDHHMMSS` reproduz um registro exato (`findRecordByTimestamp`) |
| `GET /comparar/card` | Card com as duas datas (site + a + b). Rotas `/comparar/share` existem mas não estão linkadas na UI |

Telas de share (HTML com preview + botões de baixar/compartilhar):

| Rota | Uso |
|---|---|
| `/[date]/share` | Card da data; `?site=` → card do domínio pesquisado |
| `/buscar/share` | Card do domínio; `?date=` → janela ±30d daquela data |
| `/comparar/share` | Card das duas datas (sem botão de entrada na UI) |

Formato do card (story e feed):

- **Screenshot real do portal primeiro** — captura via `lib/card-thumb.ts`
  (providers em cadeia: thum.io → Microlink; GIF rejeitado pois o Satori
  não o suporta). Viewport mobile 414×1000 no story e 1024×420 no feed,
  para mostrar masthead + manchete principal do topo da página.
  `objectFit: contain` + `objectPosition: top` — a captura aparece
  **inteira, de cima a baixo**, sem cortes.
- **Manchete embaixo do conteúdo** — apenas a **primeira** manchete do
  campo (o extrator junta até 4 chamadas com " · "; no card vale só a
  principal, que é a do topo do portal).
- Story **1080×1920** (padrão) · Feed **1200×630** (`?format=feed`).
- Cabeçalho com domínio do app + "Aquela internet em DD de mês de AAAA";
  rodapé "Veja a página real de {site} em {data} — acervo do Internet Archive".
- Cache de 1h (`stale-while-revalidate` 24h) — nunca `immutable`, pois os
  providers geram screenshots sob demanda.
- Na tela de share, botões de download ficam desabilitados até o PNG
  carregar; erro mostra retry com cache busting (`?v=`). Botões
  **"🖼️ Abrir card story/feed"** abrem a imagem exata exibida — a URL
  sempre leva **data + domínio** (ou `ts` exato), nunca "qualquer data".
- Botão **Copiar legenda** gera legenda pronta para Instagram com data por
  extenso, sites do dia e link com **UTM** (`utm_source=instagram`).

## APIs

| Endpoint | Descrição |
|---|---|
| `GET /api/snapshot?url=&date=` | Snapshot mais próximo válido de um site em uma data |
| `GET /api/day?date=` | Portais com captura no dia (JSON) |
| `GET /api/site?url=&date=` | Captura de um site arbitrário na janela ±30 dias |
| `GET /[date]/card` | PNG do card (`?site=`, `?format=feed`) |
| `GET /buscar/card` | PNG do card do domínio (`?site=`, `?date=`, `?ts=`) |
| `GET /api/cron/daily` | Agendador: sorteia data + gera card (+ posta no IG se configurado). Auth: `Authorization: Bearer $CRON_SECRET`. `?dry=1` retorna só o JSON |

## Como o Wayback é consultado (`lib/wayback.ts` + `lib/search.ts`)

1. **CDX API** em três modos:
   - `cdxExactDay` (`from=to=data`) — captura no dia exato (busca geral e
     regra do 1 card em data+domínio);
   - `cdxSearch` (janela ±30 dias) — captura mais próxima (`comparar`),
     janela de fallback (`?site=` sem captura no dia) e timeline;
   - dedup por timestamp/digest, filtro `statuscode:200`.
2. **HTML bruto** (`id_`) baixado uma vez por candidato (limitado aos
   primeiros 300KB), decodificado **pelo charset declarado na página**
   (UTF-8 / windows-1252 / latin1 — corrige mojibake "conte�do" em
   acervos antigos) e validado: tamanho mínimo, blacklist de páginas
   estacionadas/erro do Wayback.
3. **Manchetes** extraídas com Cheerio (h1–h3 + links com class/id de
   headline, filtrando nav e nome do site) — até 4 por página; o card usa
   só a primeira.
4. Regras de proteção: User-Agent customizado, timeout de 8s, intervalo
   mínimo de 500ms entre chamadas ao archive.org, retry com backoff em
   429/5xx.

Funções de busca (`lib/search.ts`):

| Função | Retorna |
|---|---|
| `findExactSiteRecord(host, date)` | 1 captura do dia exato (null se não houver) |
| `findClosestSiteRecord(host, date)` | 1 captura mais próxima em ±30 dias |
| `searchSiteWindow(host, date)` | até 8 capturas em ±30 dias |
| `searchSiteTimeline(host)` | 1 captura por âncora (~3 anos) |
| `findRecordByTimestamp(host, ts)` | captura exata por timestamp (cards `?ts=`) |
| `pickRecord(records)` | registro representativo (mais recente com manchete) |

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
Vitest · Docker · Vercel (hosting + Cron)

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
| `CRON_SECRET` | não | Secret do `/api/cron/daily` (Vercel Cron ou automação externa) |
| `IG_ACCESS_TOKEN` | não | Token Graph API — modo post direto do endpoint |
| `IG_USER_ID` | não | ID da conta Instagram Business (idem) |

## Banco de dados

Migration em `supabase/migrations/001_snapshots.sql` — já aplicada em
produção. RLS habilitado: leitura pública (anon), escrita só via service role.

## Post automático no Instagram

O endpoint **`GET /api/cron/daily`** é o ponto de integração para
agendamento externo (script Python, cron local, GitHub Actions etc.).
Ele sorteia uma data, aquece o cache do dia e devolve o material pronto:

```json
{ "date": "2014-07-07", "cardUrl": "https://…/2014-07-07/card",
  "sites": 12, "caption": "🕰️ Hoje em 7 de julho de 2014 — …" }
```

- **`?dry=1`** → só retorna o JSON acima, sem postar nada. É o modo
  recomendado para automações externas: o script baixa o `cardUrl`
  (PNG do card) e publica onde quiser com a `caption` pronta.
- **Sem `dry`** → o próprio endpoint posta no Instagram via Graph API,
  mas só se `IG_ACCESS_TOKEN` e `IG_USER_ID` estiverem configurados na
  Vercel. Se não estiverem, retorna `instagram: { skipped: true }`.
- Auth: `Authorization: Bearer $CRON_SECRET` (o Vercel Cron envia
  automaticamente; automações externas devem enviar o header).

### Credenciais do Instagram

Pré-requisitos: conta **Instagram Business/Creator** vinculada a uma
página do Facebook + app no
[Meta for Developers](https://developers.facebook.com/) com os escopos
`instagram_basic` e `instagram_content_publish`. O token e o ID da conta
(`GET /me/accounts` → conta IG vinculada) vão nas env vars `IG_*` da
Vercel — configure-as só se quiser que o próprio endpoint poste; caso
contrário, a automação externa cuida da publicação.

## Deploy

- **Vercel + GitHub (automático)**: push na `main` → build e deploy em
  produção (~1min); outras branches viram previews.
- Configuração: projeto `synapsecodeonline/aquelainternet`, env vars do
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
curl -o card.png "https://aquelainternet.vercel.app/2014-07-07/card"        # story 1080×1920
curl -o feed.png "https://aquelainternet.vercel.app/2014-07-07/card?format=feed"  # feed 1200×630
curl -o site.png "https://aquelainternet.vercel.app/buscar/card?site=uol.com.br&ts=20080711000000"
```

## Estrutura

```
app/                    rotas:
  /                     home (DatePicker)
  /aniversario          "Ver minha internet" (data de nascimento)
  /[date]               página da data (aleatória ou ?site=)
  /[date]/share         share do card da data (?site= p/ domínio)
  /[date]/card          PNG do card da data (?site=, ?format=feed)
  /buscar               timeline do domínio (?site=)
  /buscar/share         share do card do domínio (?site=, ?date=)
  /buscar/card          PNG do card do domínio (?site=, ?date=, ?ts=)
  /comparar             duas datas lado a lado (?site=&a=&b=)
  /comparar/share       share do card comparativo (sem entrada na UI)
  /comparar/card        PNG do card comparativo (sem entrada na UI)
  /api/*                snapshot, day, site, frame, cron/daily
components/             SiteGrid, SiteCard, DatePicker, ShareCard,
                        ErrorState, AnniversaryForm, CompareForm,
                        RandomDateLink, CopyLinkButton, …
lib/                    wayback.ts (CDX + HTML + charset),
                        search.ts (findExact/Closest/Window/Timeline/
                        ByTimestamp, pickRecord),
                        cache.ts (Supabase + memória, amostra de 20),
                        card-thumb.ts (screenshots p/ cards),
                        parse-headline.ts, sites.ts (lista curada),
                        date.ts, era.ts, site.ts, supabase.ts
lib/__tests__/          testes Vitest
supabase/migrations/    001_snapshots.sql
types/                  tipos compartilhados (DayResult, SnapshotRecord…)
scripts/                test-wayback.ts
vercel.json             Vercel Cron diário (warm-up do card das 12h)
prompt-*.md             especificação original do projeto (raiz)
```

## Limitações conhecidas

- Screenshot usa serviços gratuitos (thum.io → Microlink) — se ambos
  falharem, o card sai com fallback de letra (nunca quebra).
- Capturas do Wayback são irregulares: dias com pouco crawl mostram poucos
  (ou nenhum) cards — comportamento esperado, não bug. Na busca
  data+domínio isso dispara o fallback de ±30 dias.
- A busca por site cobre apenas o host exato (sem subpáginas), pois
  `matchType=host/prefix` do CDX estoura timeout.
- URLs `if_` reescrevem assets/links, mas páginas muito antigas podem ter
  assets quebrados — é parte do charme.

## Roadmap / ideias

- [ ] Domínio próprio (`aquelainternet.com`) + `NEXT_PUBLIC_SITE_URL`
- [ ] Rotacionar as chaves do Supabase (foram expostas em chat)
- [x] UTM nas legendas para medir origem Instagram/WhatsApp
- [x] Card Stories 1080×1920 (`?format=story`) e feed 1200×630
- [x] Card de portal único: screenshot inteiro + manchete principal embaixo
- [x] Página `/aniversario` com data de nascimento
- [x] Testes automatizados (Vitest, `lib/__tests__/`)
- [x] Fallback de screenshot (thum.io → Microlink; GIF rejeitado)
- [x] Comparação do mesmo site em duas datas (`/comparar?site=…&a=…&b=…`)
- [x] Busca data+domínio: 1 card no dia exato, senão ±30 dias do domínio
- [x] Timeline do domínio sem data (`/buscar?site=`)
- [x] Cards de share com URL data+domínio/`ts` exato em todas as telas
- [x] Correção de charset (mojibake) no HTML arquivado
- [x] Automação diária via `/api/cron/daily?dry=1` (JSON pronto p/ postar)
- [ ] Credenciais do Instagram (`IG_ACCESS_TOKEN` + `IG_USER_ID`) → ativar posts
- [ ] Self-hosted screenshot (Playwright) se os gratuitos virarem gargalo
