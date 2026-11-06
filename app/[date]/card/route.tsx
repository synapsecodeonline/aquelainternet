import { ImageResponse } from "next/og";
import { getDay } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDatePt(date: string): string {
  const [y, m, d] = date.split("-");
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

function formatTs(ts: string): string {
  if (!ts || ts.length < 8) return "";
  return `${ts.slice(6, 8)}/${ts.slice(4, 6)}/${ts.slice(0, 4)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: { date: string } }
) {
  const date = params.date;
  if (!DATE_RE.test(date)) {
    return new Response("data inválida", { status: 400 });
  }

  let result;
  try {
    result = await getDay(date);
  } catch {
    return new Response("erro ao gerar card", { status: 500 });
  }

  const available = result.sites.filter((s) => s.available).slice(0, 6);
  const rows: (typeof available)[] = [available.slice(0, 3), available.slice(3, 6)];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0a0a",
          padding: "48px 56px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <div style={{ fontSize: 22, color: "#a3a3a3", marginBottom: 8 }}>
            aquelainternet.com
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "white" }}>
            {`Aquela internet em ${formatDatePt(date)}`}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 14, flex: 1 }}>
              {row.map((site) => (
                <div
                  key={site.siteSlug}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backgroundColor: "#171717",
                    border: `2px solid ${site.siteColor}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: site.siteColor,
                      }}
                    />
                    <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                      {site.siteName}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: "#a3a3a3" }}>
                    {`${formatTs(site.snapshotTimestamp)}${site.headline ? ` · “${site.headline.slice(0, 40)}”` : ""}`}
                  </div>
                </div>
              ))}
              {row.length === 0 && <div style={{ flex: 1 }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <div style={{ fontSize: 18, color: "#737373" }}>
            Descubra como era a internet naquele dia — acervo do Internet Archive
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
