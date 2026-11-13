import { NextResponse } from "next/server";
import { getDay } from "@/lib/cache";
import { eraForDate } from "@/lib/era";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GRAPH_API = `https://graph.facebook.com/v21.0`;

/** Data do post: "hoje em algum ano passado" — hook nostálgico diário. */
function pickDate(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const currentYear = now.getUTCFullYear();
  // Ano aleatório entre 1996 e ano passado; se dia/mês inválido no ano
  // (ex.: 29/02), cai pra um dia válido qualquer.
  for (let i = 0; i < 10; i++) {
    const year = 1996 + Math.floor(Math.random() * (currentYear - 1996));
    const candidate = `${year}-${month}-${day}`;
    const d = new Date(`${candidate}T00:00:00Z`);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === candidate) {
      return candidate;
    }
  }
  // fallback: data aleatória válida
  const start = new Date("1996-01-01").getTime();
  const d = new Date(start + Math.random() * (now.getTime() - start));
  return d.toISOString().slice(0, 10);
}

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

function captionFor(date: string, siteNames: string[]): string {
  const sites = siteNames.slice(0, 4).join(", ") || "Google, UOL e cia";
  const era = eraForDate(date);
  return (
    `🕰️ Hoje em ${formatDatePt(date)} — ${era.label.toLowerCase()}.\n\n` +
    `${sites} renderizados direto do acervo do Internet Archive. ` +
    `Qual site te trouxe mais memória? 👇\n\n` +
    `${SITE_URL}/${date}?utm_source=instagram&utm_medium=social&utm_campaign=cron-daily`
  );
}

async function postToInstagram(imageUrl: string, caption: string) {
  const token = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  if (!token || !igUserId) {
    return { skipped: true as const, reason: "IG_ACCESS_TOKEN/IG_USER_ID não configurados" };
  }

  // 1. Cria o container de mídia
  const mediaRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: token,
    }),
  });
  const mediaJson = await mediaRes.json();
  if (!mediaRes.ok || !mediaJson.id) {
    return { skipped: false as const, error: `media container: ${JSON.stringify(mediaJson)}` };
  }

  // 2. Publica
  const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: mediaJson.id, access_token: token }),
  });
  const publishJson = await publishRes.json();
  if (!publishRes.ok) {
    return { skipped: false as const, error: `publish: ${JSON.stringify(publishJson)}` };
  }
  return { skipped: false as const, id: publishJson.id };
}

export async function GET(request: Request) {
  // Vercel Cron envia Authorization: Bearer $CRON_SECRET automaticamente
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const date = pickDate();

  // Aquece o cache do dia para a geração do card ser rápida quando o
  // Instagram baixar a imagem
  let siteNames: string[] = [];
  try {
    const day = await getDay(date);
    siteNames = day.sites.filter((s) => s.available).map((s) => s.siteName);
  } catch {
    // segue mesmo assim — o card pode falhar, mas o cron não deve quebrar
  }

  const cardUrl = `${SITE_URL}/${date}/card`;
  const caption = captionFor(date, siteNames);

  // dry=1: só devolve o material — quem chama decide o que fazer com ele
  if (dry) {
    return NextResponse.json({ date, cardUrl, sites: siteNames.length, caption });
  }

  const ig = await postToInstagram(cardUrl, caption);

  return NextResponse.json({
    date,
    cardUrl,
    sites: siteNames.length,
    caption,
    instagram: ig,
  });
}
