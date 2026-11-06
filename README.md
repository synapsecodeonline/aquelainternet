# Aquela Internet

A Internet no dia do seu aniversário. Digite uma data e veja como estavam Google,
Orkut, UOL, Globo e mais — renderizados do acervo do Wayback Machine (Internet Archive).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Cheerio · Supabase (cache) · Docker

## Como rodar local

```bash
npm install
cp .env.example .env   # opcional — sem Supabase o app usa cache em memória
npm run dev            # http://localhost:3000
```

Sem variáveis de ambiente o app funciona normalmente; o cache persistente do
Supabase fica desativado (cache em memória por processo).

## Com Docker / docker-compose

```bash
docker compose up --build
# ou: docker build -t aquelainternet . && docker run -p 3000:3000 aquelainternet
```

A imagem usa Next.js standalone (multi-stage, ~node:20-alpine, usuário não-root).
Variáveis de ambiente podem ser passadas via `docker-compose.yml` ou
`docker run -e NEXT_PUBLIC_SUPABASE_URL=...`.

## Cache (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Aplique a migration `supabase/migrations/001_snapshots.sql`
   (SQL Editor ou `supabase db push`).
3. Preencha `.env` conforme `.env.example`.

A tabela `snapshots` guarda o resultado por `(site_slug, requested_date)`.
Registros com mais de 30 dias são revalidados apenas se forem do ano corrente.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | não | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | não | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | não | Chave service role (bypass RLS p/ escrita) |
| `UPSTASH_REDIS_REST_URL` | não | Rate limit opcional |
| `UPSTASH_REDIS_REST_TOKEN` | não | Rate limit opcional |

## Testar a integração Wayback

```bash
npx tsx scripts/test-wayback.ts
```

Consulta 3 sites em 3 datas e loga snapshot + manchete extraída.

## Deploy

### Vercel

```bash
npm i -g vercel && vercel
```

### Docker em qualquer host

```bash
docker compose up -d
```

## Estrutura

```
app/            rotas (home, /[date], /[date]/share, /[date]/card, /api/*)
components/     UI (SiteGrid, SiteCard, DatePicker, ShareCard, ErrorState)
lib/            wayback.ts, sites.ts, parse-headline.ts, cache.ts, supabase.ts
supabase/       migrations
scripts/        test-wayback.ts
```
