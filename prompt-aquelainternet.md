PROJETO: "Aquela Internet" — A Internet No Dia Do Seu Aniversário

================================================================================
1. VISÃO GERAL
================================================================================

Construa o MVP de um web app chamado "Aquela Internet" (domínio: aquelainternet.com).
O produto mostra como a internet inteira estava em uma data específica, usando o
acervo do Wayback Machine (Internet Archive).

O usuário digita uma data. O app exibe uma grade com 8-12 sites icônicos daquela
época, cada um renderizado em um iframe do Wayback, exatamente como estavam
naquele dia. Abaixo de cada site, a manchete/título extraído do HTML arquivado.
O resultado é exportável como card PNG compartilhável (og:image dinâmica).

Frase de posicionamento: "Em 15/03/1995, aquela internet era assim."

================================================================================
2. ESCOPO DO MVP
================================================================================

2.1 Página inicial (app/page.tsx)
- Date picker (default: hoje menos 10 anos)
- Botão "Ver aquela internet"
- Botão "🎲 Me surpreenda" (data aleatória entre 1996 e hoje)
- 4 atalhos: 07/07/2014 (7x1), 11/09/2001 (9/11), 15/03/2020 (pandemia),
  01/01/2000 (bug do milênio)

2.2 Página de resultado (app/[date]/page.tsx)
- Grade responsiva com os sites da lista curada
- Cada célula:
  - iframe do Wayback (altura ~400px, scroll interno)
  - Nome do site + data do snapshot + manchete extraída
  - Link "abrir no Wayback" (target="_blank")
  - Se não houver snapshot: card cinza "sem registro neste dia"
- Botão "📸 Gerar card pra compartilhar" → /[date]/card
- Botão "🎲 Outra data"

2.3 Card compartilhável (app/[date]/card/route.tsx)
- Card 1200x630 via ImageResponse (ver seção 7)
- Título: "Aquela internet em {data por extenso}"
- Grid 3x2 com 6 miniaturas + nomes
- Rodapé: "aquelainternet.com"
- Botões "Baixar PNG" e "Compartilhar" (Web Share API)
- Esta rota é também og:image da página /[date]

2.4 APIs internas (app/api/)
- GET /api/snapshot?url={site}&date={YYYY-MM-DD}
  → { snapshotUrl, timestamp, status, headline } ou { available: false }
- GET /api/day?date={YYYY-MM-DD}
  → array com resultado de todos os sites da lista curada
  → cache obrigatório (ver seção 6)

================================================================================
3. STACK TECNOLÓGICA COMPLETA
================================================================================

Camada            | Ferramenta                          | Versão/Detalhe
------------------|-------------------------------------|--------------------------------------------
Framework         | Next.js (App Router)                | 14+
Linguagem         | TypeScript                          | —
Estilo            | Tailwind CSS                        | —
Componentes       | shadcn/ui                           | npx shadcn@latest init
                  |                                     | npx shadcn@latest add button
OG Image          | ImageResponse de next/og            | App Router já inclui @vercel/og
Banco (cache)     | Supabase (Postgres)                 | Env: NEXT_PUBLIC_SUPABASE_URL,
                  |                                     | NEXT_PUBLIC_SUPABASE_ANON_KEY
Rate limit (opc.) | Upstash Redis                       | npm install @upstash/ratelimit @upstash/redis
                  |                                     | Env: UPSTASH_REDIS_REST_URL,
                  |                                     | UPSTASH_REDIS_REST_TOKEN
Parsing HTML      | Cheerio                             | npm install cheerio
Deploy            | Vercel                              | —
Container         | Docker + Docker Compose             | Dockerfile multi-stage
                  |                                     | (node:20-alpine, standalone)

================================================================================
3.1 DOCKER (IMPLEMENTADO)
================================================================================

Arquivos criados:
- Dockerfile          → build multi-stage (deps → builder → runner), imagem final
                        roda `node server.js` (Next.js standalone), usuário
                        não-root `nextjs`, porta 3000.
- docker-compose.yml  → service `web`, build local, porta 3000:3000,
                        env vars via interpolation (opcionais).
- .dockerignore       → exclui node_modules, .next, .env, .git, etc.
- next.config.mjs     → `output: "standalone"` habilitado.

Comandos:
  docker compose up --build     # build + sobe em http://localhost:3000
  docker compose up -d          # detached
  docker compose down           # para
  docker build -t aquelainternet . && docker run -p 3000:3000 aquelainternet

Variáveis de ambiente: todas opcionais. Sem Supabase, o app usa cache em
memória por processo (funciona, mas não persiste entre restarts).

Desvio consciente do spec: app/[date]/card/route.tsx usa
`runtime = "nodejs"` em vez de "edge", pois o card precisa chamar
lib/cache.ts → Supabase/Cheerio, que não são edge-safe. ImageResponse
funciona normalmente em nodejs runtime.

Página extra implementada: /[date]/share — preview do card PNG com botões
"Baixar PNG" (Web Share/download) e "Compartilhar" (Web Share API), já que
/[date]/card precisa responder imagem pura para og:image.

================================================================================
4. LISTA CURADA DE SITES
================================================================================

Arquivo: lib/sites.ts

interface SiteEntry {
  slug: string;
  name: string;
  url: string;        // domínio usado na consulta
  era: { start: number; end?: number };
  color: string;      // cor de fallback
}

export const SITES: SiteEntry[] = [
  { slug: "google",    name: "Google",    url: "google.com",     era: { start: 1998 },            color: "#4285F4" },
  { slug: "youtube",   name: "YouTube",   url: "youtube.com",    era: { start: 2005 },            color: "#FF0000" },
  { slug: "orkut",     name: "Orkut",     url: "orkut.com",      era: { start: 1998, end: 2014 }, color: "#ED2590" },
  { slug: "facebook",  name: "Facebook",  url: "facebook.com",   era: { start: 2004 },            color: "#1877F2" },
  { slug: "twitter",   name: "Twitter/X", url: "twitter.com",    era: { start: 2006 },            color: "#000000" },
  { slug: "instagram", name: "Instagram", url: "instagram.com",  era: { start: 2010 },            color: "#E4405F" },
  { slug: "uol",       name: "UOL",       url: "uol.com.br",     era: { start: 1996 },            color: "#FFD200" },
  { slug: "globo",     name: "Globo",     url: "globo.com",      era: { start: 1996 },            color: "#C8102E" },
  { slug: "wikipedia", name: "Wikipedia", url: "wikipedia.org",  era: { start: 2001 },            color: "#000000" },
  { slug: "yahoo",     name: "Yahoo",     url: "yahoo.com",      era: { start: 1994 },            color: "#6001D2" },
  { slug: "msn",       name: "MSN",       url: "msn.com",        era: { start: 1995 },            color: "#0078D4" },
  { slug: "geocities", name: "GeoCities", url: "geocities.com",  era: { start: 1994, end: 2009 }, color: "#00A650" },
];

Regra: Se a data escolhida for anterior a era.start ou posterior a era.end,
o site NÃO entra na grade e NÃO consulte o Wayback.

================================================================================
5. INTEGRAÇÃO COM O WAYBACK MACHINE — DETALHAMENTO COMPLETO
================================================================================

5.1 Availability API (primeira tentativa — rápida)

Endpoint oficial:
GET https://archive.org/wayback/available
Documentação: https://archive.org/developers/_static/wayback.json

Parâmetros:
- url (obrigatório): URL alvo (ex.: google.com)
- timestamp (opcional): data no formato YYYYMMDD (ex.: 20140707).
  Se omitido, retorna o snapshot mais recente.

Exemplo de requisição:
curl "https://archive.org/wayback/available?url=google.com&timestamp=20140707"

Exemplo de resposta (sucesso):
{
  "archived_snapshots": {
    "closest": {
      "available": true,
      "url": "http://web.archive.org/web/20140707120000/http://www.google.com/",
      "timestamp": "20140707120000",
      "status": "200"
    }
  }
}

Exemplo de resposta (sem snapshot):
{
  "archived_snapshots": {}
}

Regra de uso: Use esta API primeiro. Se retornar available:false ou vazio,
NÃO caia imediatamente para o CDX; primeiro verifique se o site estava ativo
na data (regra da era). Se estava ativo e a Availability falhou, use o CDX.

5.2 CDX API (fallback preciso)

Endpoint oficial:
GET https://web.archive.org/cdx/search/cdx
Documentação: https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server

Parâmetros essenciais:
- url (obrigatório): URL alvo
- output: json para retorno estruturado
- from: data inicial YYYYMMDD
- to: data final YYYYMMDD
- limit: número máximo de resultados (ex.: 1)
- filter: ex.: statuscode:200 para apenas capturas OK

Formato da resposta JSON:
O primeiro elemento é o cabeçalho com os nomes das colunas:
["urlkey","timestamp","original","mimetype","statuscode","digest","length"]
Os elementos seguintes são arrays com os valores correspondentes.

Exemplo de requisição:
curl "https://web.archive.org/cdx/search/cdx?url=google.com&output=json&from=20140707&to=20140714&limit=1&filter=statuscode:200"

Exemplo de resposta:
[
  ["urlkey","timestamp","original","mimetype","statuscode","digest","length"],
  ["com,google)/","20140707120000","http://www.google.com/","text/html","200","ABC123...","12345"]
]

Match types (para consultas mais amplas, se necessário):
- exact (padrão)
- prefix
- host
- domain

5.3 Extração de manchete do HTML bruto

Como baixar o HTML original (sem toolbar do Wayback):
Adicione o sufixo id_ logo após o timestamp no path:
https://web.archive.org/web/{timestamp}id_/{url}

Exemplo:
https://web.archive.org/web/20140707120000id_/http://www.google.com/

Isso retorna o conteúdo bruto original, sem reescrita de links e sem toolbar.

Parsing com Cheerio:

import * as cheerio from "cheerio";

export function extractHeadline(html: string): string | null {
  const $ = cheerio.load(html);

  // 1ª tentativa: h1
  const h1 = $("h1").first().text().trim();
  if (h1) return h1.slice(0, 120);

  // 2ª tentativa: title
  const title = $("title").first().text().trim();
  if (title) return title.slice(0, 120);

  // 3ª tentativa: heurística — primeiro link dentro de <header>
  const headerLink = $("header a").first().text().trim();
  if (headerLink) return headerLink.slice(0, 120);

  return null;
}

Cheerio é uma biblioteca de parsing HTML/XML com API estilo jQuery, rápida
e sem necessidade de navegador.

5.4 Requisitos obrigatórios de rede

- User-Agent customizado em TODAS as requisições ao archive.org:
  AquelaInternet/1.0 (+https://aquelainternet.com; contato@aquelainternet.com)
- Delay mínimo de 500ms entre chamadas consecutivas dentro de /api/day.
- Timeout de 8 segundos por site (se o Wayback não responder, marcar como unavailable).
- Cache obrigatório — nunca chame o Wayback sem antes checar o cache (seção 6).

================================================================================
6. CACHE E PERSISTÊNCIA (SUPABASE)
================================================================================

6.1 Migration SQL

Arquivo: supabase/migrations/001_snapshots.sql

create table if not exists snapshots (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null,
  requested_date date not null,
  snapshot_timestamp text not null,
  snapshot_url text not null,
  status_code int,
  headline text,
  available boolean default false,
  created_at timestamptz default now(),
  unique (site_slug, requested_date)
);

alter table snapshots enable row level security;

create policy "public can read snapshots"
  on snapshots for select
  to anon
  using (true);

grant select on public.snapshots to anon;

6.2 Lógica de cache em /api/day

1. Consultar snapshots onde requested_date = date.
2. Para os sites que faltam, chamar o Wayback (Availability → CDX) com delay de 500ms.
3. Inserir os novos resultados no banco.
4. Retornar o combinado.

TTL: revalidar registros com mais de 30 dias APENAS se o snapshot for do ano
corrente (anos passados nunca mudam).

6.3 Variáveis de ambiente

Arquivo: .env.example

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
# Opcional (rate limit)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

================================================================================
7. GERAÇÃO DO CARD OG (IMAGERESPONSE)
================================================================================

7.1 Como funciona
ImageResponse do next/og usa @vercel/og, Satori e Resvg para converter JSX/CSS
em PNG. O App Router já inclui @vercel/og; não é necessário instalar separadamente.

7.2 Arquivo app/[date]/card/route.tsx

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  const date = params.date;
  // ... buscar dados do dia (do cache ou /api/day)

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "40px",
        }}
      >
        <div style={{ fontSize: 60, fontWeight: "bold", color: "white" }}>
          Aquela internet em {formatDate(date)}
        </div>
        {/* grid 3x2 com miniaturas — use flexbox, NÃO grid */}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

7.3 Limitações técnicas do ImageResponse
- Apenas flexbox e um subconjunto de CSS. display: grid NÃO funciona. Use flexbox.
- Tamanho máximo do bundle: 500KB (JSX + CSS + fontes + imagens).
- Fontes: apenas ttf, otf, woff.
- Cache: Cache-Control: public, max-age=31536000, immutable (a data não muda).

================================================================================
8. METADADOS E SEO
================================================================================

Na página /[date]:

export const metadata = {
  title: `Aquela Internet em ${date} | Aquela Internet`,
  description: "Veja como estavam Google, Orkut, UOL e mais naquele dia.",
  openGraph: {
    title: `Aquela Internet em ${date}`,
    images: [`https://aquelainternet.com/${date}/card`],
  },
  twitter: { card: "summary_large_image" },
};

- URL canônica: https://aquelainternet.com/{date}
- JSON-LD: WebPage com datePublished = data escolhida.

================================================================================
9. TRATAMENTO DE ERRO E EDGE CASES
================================================================================

Situação                    | Ação
----------------------------|--------------------------------------------------
Data futura                 | Retornar 400: "essa data ainda não aconteceu"
Data anterior a 1996        | Aviso: "a internet ainda engatinhava — pouco arquivado"
Site fora da era            | Não entra na grade; não consulta Wayback
Site sem snapshot           | Card cinza "sem registro neste dia"
Wayback timeout (>8s)       | Marcar como unavailable; não travar a página
Falha total do archive.org  | Página de erro amigável com botão "Tentar novamente"
iframe bloqueado            | Fallback: mostrar apenas o card com manchete (sem iframe)

================================================================================
10. LANDING PAGE (COPY)
================================================================================

H1: "Como era aquela internet no dia em que você nasceu?"
Subtítulo: "Descubra como estavam o Google, o Orkut e o UOL naquele dia — direto
do acervo do Internet Archive."
Input + botão: "Ver aquela internet"
Seção: "Datas que marcaram" (4 atalhos)
Seção: "Como funciona" (3 passos)
Footer: crédito ao Internet Archive + link para a API pública.

================================================================================
11. NÃO-OBJETIVOS (NÃO CONSTRUA NO MVP)
================================================================================

- Autenticação / login
- Banco de usuários
- Bot de X/Twitter
- Busca por palavra ("quando o mundo começou a falar de X")
- Timeline comparativa
- Internacionalização (só pt-BR)
- Analytics custom (use Vercel Analytics)

================================================================================
12. CRITÉRIOS DE ACEITE
================================================================================

1. Abrir a home, escolher 07/07/2014 e receber grade com ≥6 sites renderizados.
2. A página /2014-07-07 tem og:image funcionando (testável em opengraph.xyz).
3. Baixar o card PNG funciona; o arquivo tem 1200x630.
4. Escolher data de 1994 mostra aviso apropriado (não quebra).
5. Recarregar a mesma data 2x: a 2ª resposta vem do cache (latência <500ms).
6. Nenhuma requisição ao archive.org sem o User-Agent customizado.
7. Deploy na Vercel funciona sem env vars faltando (npm run build passa).
8. Lighthouse mobile: performance ≥80, acessibilidade ≥90.

================================================================================
13. ESTRUTURA DE ARQUIVOS ESPERADA
================================================================================

app/
  page.tsx                        # home
  [date]/page.tsx                 # resultado
  [date]/card/route.tsx           # og image
  api/snapshot/route.ts
  api/day/route.ts
  layout.tsx
  globals.css
components/
  SiteGrid.tsx
  SiteCard.tsx
  DatePicker.tsx
  ShareCard.tsx
  ErrorState.tsx
lib/
  sites.ts                        # lista curada
  wayback.ts                      # client das APIs
  parse-headline.ts               # cheerio
  supabase.ts
  cache.ts                        # lógica de cache
types/
  index.ts
supabase/
  migrations/001_snapshots.sql
scripts/
  test-wayback.ts                 # validação isolada
.env.example
README.md

================================================================================
14. ENTREGÁVEIS
================================================================================

1. Repositório Git com o código acima.
2. README.md com: como rodar local, como aplicar migration no Supabase,
   como deployar na Vercel, variáveis de ambiente.
3. .env.example completo.
4. scripts/test-wayback.ts que consulta 3 sites em 3 datas e loga o resultado
   (valida a integração sem subir o app).

================================================================================
15. INSTRUÇÕES DE EXECUÇÃO (ORDEM OBRIGATÓRIA)
================================================================================

1. Crie lib/wayback.ts primeiro — é a peça mais crítica.
2. Rode scripts/test-wayback.ts e mostre o output antes de seguir.
3. Só depois construa /api/day com cache.
4. Depois a página /[date].
5. Depois o card OG (/[date]/card/route.tsx).
6. Por último, polish visual e landing.
7. Rode npm run build a cada etapa e corrija erros antes de avançar.
8. NÃO invente APIs do Wayback — use exatamente os endpoints da seção 5.
9. Se um endpoint do Wayback falhar nos testes, PARE e avise antes de improvisar.

================================================================================
16. REFERÊNCIAS TÉCNICAS (LINKS DIRETOS)
================================================================================

Recurso                          | URL
---------------------------------|--------------------------------------------------------------
Availability API (spec)          | https://archive.org/developers/_static/wayback.json
Availability API (exemplo)       | https://archive.org/wayback/available?url=example.com
CDX API (README oficial)         | https://github.com/internetarchive/wayback/tree/master/wayback-cdx-server
CDX API (exemplo JSON)           | https://web.archive.org/cdx/search/cdx?url=example.com&output=json&limit=1
HTML bruto (id_)                 | https://web.archive.org/web/{timestamp}id_/{url}
ImageResponse (docs Next.js)     | https://nextjs.org/docs/app/api-reference/functions/image-response
Supabase + Next.js (quickstart)  | https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
shadcn/ui (setup)                | https://ui.shadcn.com/docs/installation/next
Cheerio (npm)                    | https://www.npmjs.com/package/cheerio
Upstash Rate Limit               | https://www.npmjs.com/package/@upstash/ratelimit

================================================================================
FIM DO PROMPT
================================================================================

Boa sorte. Comece pelo lib/wayback.ts e me mostre o output do
scripts/test-wayback.ts antes de seguir para a UI.