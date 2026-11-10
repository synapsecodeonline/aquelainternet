import * as cheerio from "cheerio";
import { normalizeTopic } from "./topic";

/**
 * Extrai a manchete/título do HTML arquivado.
 * Ordem: h1 → title → primeiro link dentro de <header>.
 */
export function extractHeadline(html: string): string | null {
  const $ = cheerio.load(html);

  const h1 = $("h1").first().text().trim();
  if (h1) return h1.slice(0, 120);

  const title = $("title").first().text().trim();
  if (title) return title.slice(0, 120);

  const headerLink = $("header a").first().text().trim();
  if (headerLink) return headerLink.slice(0, 120);

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  if (ogTitle) return ogTitle.slice(0, 120);

  const description = $('meta[name="description"]').attr("content")?.trim();
  if (description) return description.slice(0, 120);

  return null;
}

const MIN_LEN = 20;
const MAX_LEN = 140;
const STOP_RE =
  /^(ler mais|leia mais|leia também|assista|veja também|clique aqui|compartilhar|curtir|comentar|compre|publicidade|propaganda|newsletter|cadastre)/i;
const HEADLINE_CLASS_RE = /title|headline|matter|materia|noticia|story|destaque|call|news/i;

function clean(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Extrai as principais "chamadas de matéria" de uma homepage portada:
 * textos de h1–h3 e links com class/id de headline. Filtra rótulos de
 * navegação curtos ("Esportes", "Lazer") e chamadas de ação ("Ler mais").
 */
export function extractTopHeadlines(html: string, max = 6): string[] {
  const $ = cheerio.load(html);
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string | null | undefined) => {
    if (out.length >= max) return;
    const s = clean(raw);
    if (s.length < MIN_LEN || s.length > MAX_LEN) return;
    if (STOP_RE.test(s)) return;
    const key = s.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s.slice(0, MAX_LEN));
  };

  $("h1, h2, h3").each((_, el) => push($(el).text()));

  $("a").each((_, el) => {
    if (out.length >= max) return;
    const cls = `${$(el).attr("class") ?? ""} ${$(el).attr("id") ?? ""}`;
    if (HEADLINE_CLASS_RE.test(cls)) push($(el).text());
  });

  // Se ainda achou pouco, varre links de texto longo dentro de <main>/<article>
  if (out.length < 3) {
    $("main a, article a").each((_, el) => {
      if (out.length >= max) return false;
      push($(el).text());
    });
  }

  return out;
}

/** O texto é/basicamente o nome do site (logo/title), não uma notícia?
 *  Casa por fronteira de palavra para não confundir "iG" com "investigação". */
function isSiteName(text: string, siteName: string): boolean {
  const n = normalizeTopic(siteName);
  if (n.length < 2) return false;
  const t = normalizeTopic(text);
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(t)) return false;
  // Só descarta se também parecer título de site ("Portal de notícias…"),
  // não uma notícia que por acaso contém a palavra ("Folha de pagamento…").
  return /noticia|portal|online|jornal|site|informac|conteudo|brasil|mundo/.test(t);
}

/**
 * Manchete para cards e filtro de assunto: até 4 chamadas de matéria
 * reais (sem as que são só o nome do site), unidas por " · ".
 * Fallback: extrator antigo quando não há chamadas identificáveis.
 */
export function extractCardHeadline(html: string, siteName?: string): string | null {
  const tops = extractTopHeadlines(html).filter(
    (t) => !siteName || !isSiteName(t, siteName)
  );
  if (tops.length > 0) return tops.slice(0, 4).join(" · ");
  return extractHeadline(html);
}
