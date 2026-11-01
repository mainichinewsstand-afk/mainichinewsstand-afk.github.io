// ニュースを各RSSから集めて public/news.json に書き出すスクリプト
// GitHub Actions から1時間ごとに実行されます。
import { readFile, writeFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import { createHash } from "node:crypto";

// 配信元の一覧。増やしたいときはここに1行足すだけでOK
const FEEDS = [
  { category: "dom",   source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/domestic.xml" },
  { category: "world", source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/world.xml" },
  { category: "eco",   source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/business.xml" },
  { category: "tech",  source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/it.xml" },
  { category: "tech",  source: "ITmedia AI+",    url: "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml" },
  { category: "ent",    source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/entertainment.xml" },
  { category: "sports", source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/sports.xml" },
  { category: "sci",    source: "Yahoo!ニュース", url: "https://news.yahoo.co.jp/rss/topics/science.xml" },
];

const OUT = new URL("../public/news.json", import.meta.url);
const KEEP_DAYS = 3;          // これより古い記事は消す
const MAX_PER_CATEGORY = 40;  // カテゴリごとの最大件数
const FIXTURE_DIR = process.env.NEWS_FIXTURE_DIR; // テスト用: ネットの代わりにファイルを読む

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const text = v => (v == null ? "" : typeof v === "object" ? (v["#text"] ?? "") : String(v)).trim();
const asArray = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

export function parseFeed(xml, feed) {
  const doc = parser.parse(xml);
  // RSS 2.0 / RSS 1.0(RDF) / Atom のどれでも読めるようにする
  const items =
    asArray(doc?.rss?.channel?.item).length ? asArray(doc.rss.channel.item) :
    asArray(doc?.["rdf:RDF"]?.item).length ? asArray(doc["rdf:RDF"].item) :
    asArray(doc?.feed?.entry);
  return items.map(it => {
    const link = typeof it.link === "object" && it.link["@_href"] ? it.link["@_href"] : text(it.link);
    const date = text(it.pubDate) || text(it["dc:date"]) || text(it.published) || text(it.updated);
    const t = new Date(date);
    return {
      category: feed.category,
      source: feed.source,
      title: text(it.title).replace(/\s+/g, " "),
      url: link,
      publishedAt: isNaN(t) ? new Date().toISOString() : t.toISOString(),
    };
  }).filter(a => a.title && /^https?:\/\//.test(a.url));
}

async function load(feed, i) {
  if (FIXTURE_DIR) return readFile(`${FIXTURE_DIR}/${i}.xml`, "utf8");
  const res = await fetch(feed.url, { headers: { "user-agent": "news-stand-bot/1.0" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function main() {
  let previous = [];
  try { previous = JSON.parse(await readFile(OUT, "utf8")).articles ?? []; } catch {}

  const fresh = [];
  let ok = 0;
  for (const [i, feed] of FEEDS.entries()) {
    try {
      const items = parseFeed(await load(feed, i), feed);
      fresh.push(...items); ok++;
      console.log(`✓ ${feed.source} (${feed.category}): ${items.length}件`);
    } catch (e) {
      console.warn(`✗ ${feed.url}: ${e.message}`); // 1つ失敗しても他は続ける
    }
  }
  if (ok === 0) { console.error("すべての配信元の取得に失敗したため、前回のデータを残します"); process.exit(0); }

  // URLで重複を除き、新しい順に並べ、古い記事を落とす
  const byUrl = new Map();
  for (const a of [...previous, ...fresh]) {
    const key = a.url.split("?")[0];
    if (!byUrl.has(key)) byUrl.set(key, a);
  }
  const cutoff = Date.now() - KEEP_DAYS * 864e5;
  const sorted = [...byUrl.values()]
    .filter(a => new Date(a.publishedAt).getTime() >= cutoff)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const count = {};
  const articles = sorted.filter(a => (count[a.category] = (count[a.category] || 0) + 1) <= MAX_PER_CATEGORY)
    .map(a => ({ ...a, id: createHash("sha1").update(a.url.split("?")[0]).digest("hex").slice(0, 12) }));

  await writeFile(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), articles }, null, 1) + "\n");
  console.log(`合計 ${articles.length}件を書き出しました`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
