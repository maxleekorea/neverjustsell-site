import { KNOWLEDGE_ENTRIES as LEGACY_KNOWLEDGE_ENTRIES } from "./knowledge-hub-v2.js";

const SITE = "https://www.neverjustsell.com";
const CLASSROOM = "https://classroom.neverjustsell.com";
const COMMUNITY = "https://community.neverjustsell.com";

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const typeLabel = (type) => ({ term: "용어", case: "사례", brief: "브리핑", guide: "가이드", article: "지식" }[type] || "지식");
const catLabel = (category) => ({ marketing: "마케팅", commerce: "온라인 커머스", case: "실전 사례", brief: "트렌드" }[category] || category || "전체");

function normalizeEntry(item) {
  const slug = String(item?.slug || "").trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) return null;
  return {
    slug,
    title: String(item?.title || "").trim(),
    type: String(item?.type || "article").trim(),
    category: String(item?.category || "general").trim(),
    summary: String(item?.summary || "").trim(),
    body: String(item?.body || "").trim(),
    keywords: Array.isArray(item?.keywords) ? item.keywords.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 20) : [],
    updated: String(item?.updated || item?.updated_at || "").slice(0, 10),
    version: Number(item?.version || 1),
    review_due_at: item?.review_due_at || null
  };
}

export function normalizeKnowledgeEntries(items) {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const normalized = [];
  for (const item of list) {
    const row = normalizeEntry(item);
    if (!row || !row.title || seen.has(row.slug)) continue;
    seen.add(row.slug);
    normalized.push(row);
  }
  return normalized;
}

export async function loadKnowledgeEntries(env) {
  if (!env?.KNOWLEDGE_BRIDGE || typeof env.KNOWLEDGE_BRIDGE.fetch !== "function") {
    return { source: "legacy", entries: LEGACY_KNOWLEDGE_ENTRIES };
  }
  try {
    const response = await env.KNOWLEDGE_BRIDGE.fetch(new Request(`${CLASSROOM}/knowledge/public?limit=500`, {
      method: "GET",
      headers: { Accept: "application/json" }
    }));
    if (!response.ok) return { source: "legacy", entries: LEGACY_KNOWLEDGE_ENTRIES };
    const payload = await response.json().catch(() => null);
    const entries = normalizeKnowledgeEntries(payload?.items);
    if (payload?.ok === true && payload?.active === true && entries.length > 0) {
      return { source: "canonical", entries, version: payload?.version || null };
    }
  } catch (error) {
    console.error("knowledge bridge read failed", error);
  }
  return { source: "legacy", entries: LEGACY_KNOWLEDGE_ENTRIES };
}

function styles() {
  return `<style>:root{--ink:#161412;--muted:#746d65;--line:#ddd5cb;--paper:#f7f4ef;--accent:#765333}*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(1160px,calc(100% - 32px));margin:auto}.top{height:66px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-size:13px;font-weight:800;letter-spacing:.13em;text-decoration:none}.back{font-size:13px;color:var(--muted)}.hero{padding:60px 0 34px}.kicker{font-size:11px;letter-spacing:.14em;color:var(--accent);font-weight:800}.hero h1,.article h1{font-size:clamp(34px,7vw,64px);line-height:1.08;letter-spacing:-.045em;margin:12px 0 18px}.hero p{max-width:720px;color:var(--muted)}.toolbar{position:sticky;top:0;z-index:5;background:rgba(247,244,239,.96);padding:14px 0;border-block:1px solid var(--line)}.controls{display:flex;gap:10px;flex-wrap:wrap}.search{flex:1;min-width:220px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:12px 16px;font-size:15px}.filters{display:flex;gap:7px;overflow:auto}.filter{white-space:nowrap;border:1px solid var(--line);background:transparent;border-radius:999px;padding:9px 12px;font-weight:700;cursor:pointer}.filter.active{background:var(--ink);color:#fff}.meta{padding:20px 0 8px;color:var(--muted);font-size:13px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:12px 0 70px}.card{background:#fff;border:1px solid var(--line);padding:21px;min-height:210px;display:flex;flex-direction:column;text-decoration:none}.card:hover{border-color:#aa9c8c}.card-top{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--accent);font-weight:800}.card h2{font-size:20px;line-height:1.35;margin:16px 0 8px}.card p{font-size:14px;color:var(--muted);margin:0 0 16px}.tags{margin-top:auto;display:flex;gap:5px;flex-wrap:wrap}.tag{font-size:11px;background:#f4f0ea;padding:4px 7px;border-radius:999px;color:#766d64}.empty{display:none;padding:50px 0;color:var(--muted)}.footer{border-top:1px solid var(--line);padding:28px 0 44px;color:var(--muted);font-size:12px}.article{width:min(780px,calc(100% - 32px));margin:auto;padding:50px 0 76px}.summary{font-size:19px;color:#544d46;margin-bottom:30px}.body{background:#fff;border:1px solid var(--line);padding:30px;font-size:17px;line-height:1.9}.info{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;color:var(--muted);font-size:12px}.actions{display:flex;gap:9px;margin-top:26px;flex-wrap:wrap}.btn{border-radius:999px;padding:11px 15px;text-decoration:none;font-weight:800;font-size:13px;border:1px solid var(--ink);background:var(--ink);color:#fff}.btn.line{background:transparent;color:var(--ink)}button.btn{cursor:pointer}.related{margin-top:40px}.related-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.related-grid a{background:#fff;border:1px solid var(--line);padding:15px;text-decoration:none;font-weight:700}.toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#161412;color:#fff;border-radius:999px;padding:9px 14px;font-size:13px;opacity:0;transition:.2s}.toast.show{opacity:1}@media(max-width:820px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.shell{width:calc(100% - 20px)}.top{height:58px}.hero{padding:34px 0 24px}.hero h1,.article h1{font-size:38px}.controls{display:block}.search{width:100%;margin-bottom:10px}.filters{width:100%}.grid{grid-template-columns:1fr;gap:9px}.card{min-height:0;padding:18px}.article{width:calc(100% - 20px);padding:36px 0 60px}.summary{font-size:17px}.body{padding:20px;font-size:16px}.actions .btn{flex:1;text-align:center}.related-grid{grid-template-columns:1fr}}</style>`;
}

function shell(title, description, canonical, body, jsonLd) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:site_name" content="NEVER JUST SELL">${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replaceAll("<", "\\u003c")}</script>` : ""}${styles()}</head><body><header class="shell top"><a class="brand" href="/">NEVER JUST SELL</a><a class="back" href="/knowledge">지식 허브</a></header>${body}<footer class="footer"><div class="shell">NEVER JUST SELL · 공개 지식은 검색과 공유를 위해 열어두고 강의와 커뮤니티에서 더 깊게 연결합니다.</div></footer><div id="toast" class="toast">저장했습니다.</div></body></html>`;
}

const listScript = `<script>(function(){const s=document.querySelector('#search'),bs=[...document.querySelectorAll('[data-filter]')],cs=[...document.querySelectorAll('[data-card]')],n=document.querySelector('#count'),e=document.querySelector('#empty');let f='all';function go(){const q=(s.value||'').trim().toLowerCase();let v=0;cs.forEach(c=>{const ok=(f==='all'||c.dataset.category===f)&&(!q||(c.dataset.search||'').includes(q));c.style.display=ok?'':'none';if(ok)v++});n.textContent=v+'개';e.style.display=v?'none':'block'}bs.forEach(b=>b.onclick=()=>{f=b.dataset.filter;bs.forEach(x=>x.classList.toggle('active',x===b));go()});s.oninput=go;go()})();</script>`;

export function renderKnowledgeIndex(entries = LEGACY_KNOWLEDGE_ENTRIES) {
  const list = normalizeKnowledgeEntries(entries);
  const cards = list.map((x) => `<a class="card" data-card data-category="${esc(x.category)}" data-search="${esc([x.title,x.summary,...x.keywords].join(" ").toLowerCase())}" href="/knowledge/${encodeURIComponent(x.slug)}"><div class="card-top"><span>${esc(typeLabel(x.type))} · ${esc(catLabel(x.category))}</span><span>${esc(x.updated)}</span></div><h2>${esc(x.title)}</h2><p>${esc(x.summary)}</p><div class="tags">${x.keywords.map((k) => `<span class="tag">${esc(k)}</span>`).join("")}</div></a>`).join("");
  const body = `<main><section class="hero"><div class="shell"><div class="kicker">NJS KNOWLEDGE HUB</div><h1>사업을 하면서<br>자주 꺼내보는 지식.</h1><p>마케팅과 온라인 커머스 용어, 실제 운영 사례, 시장 변화를 짧게 읽고 바로 연결합니다. 게시판이 아니라 검색하고 저장하고 다시 찾는 지식 라이브러리입니다.</p></div></section><section class="toolbar"><div class="shell controls"><input id="search" class="search" type="search" placeholder="키워드, 용어, 사례 검색"><div class="filters"><button class="filter active" data-filter="all">전체</button><button class="filter" data-filter="marketing">마케팅</button><button class="filter" data-filter="commerce">온라인 커머스</button><button class="filter" data-filter="case">사례</button><button class="filter" data-filter="brief">브리핑</button></div></div></section><div class="shell"><div class="meta"><strong id="count">${list.length}개</strong> · 공개 지식 베이스</div><div class="grid">${cards}</div><div id="empty" class="empty">검색 결과가 없습니다.</div></div></main>${listScript}`;
  return shell("지식 허브 | NEVER JUST SELL", "마케팅·온라인 커머스 용어, 운영 사례와 트렌드 브리핑을 검색하는 무료 지식 허브.", `${SITE}/knowledge`, body, { "@context":"https://schema.org", "@type":"CollectionPage", name:"NEVER JUST SELL 지식 허브", url:`${SITE}/knowledge`, numberOfItems:list.length });
}

export function findKnowledgeEntry(slug, entries = LEGACY_KNOWLEDGE_ENTRIES) {
  return normalizeKnowledgeEntries(entries).find((x) => x.slug === slug) || null;
}

export function renderKnowledgeEntry(x, entries = LEGACY_KNOWLEDGE_ENTRIES) {
  const list = normalizeKnowledgeEntries(entries);
  const related = list.filter((y) => y.slug !== x.slug && (y.category === x.category || y.keywords.some((k) => x.keywords.includes(k)))).slice(0, 4);
  const save = `<script>(function(){const b=document.querySelector('[data-save]'),t=document.querySelector('#toast'),key='njs_knowledge_saved',slug=${JSON.stringify(x.slug)};const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}};function paint(){b.textContent=read().includes(slug)?'저장됨':'브라우저에 저장'}b.onclick=()=>{let a=read();a=a.includes(slug)?a.filter(v=>v!==slug):[...a,slug];localStorage.setItem(key,JSON.stringify(a));paint();t.textContent=a.includes(slug)?'저장했습니다.':'저장을 해제했습니다.';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)};paint()})();</script>`;
  const body = `<main class="article"><div class="kicker">${esc(typeLabel(x.type))} · ${esc(catLabel(x.category))}</div><h1>${esc(x.title)}</h1><p class="summary">${esc(x.summary)}</p><article class="body">${esc(x.body)}</article><div class="info"><span>업데이트 ${esc(x.updated)}</span><span>·</span><span>${x.keywords.map(esc).join(" · ")}</span></div><div class="actions"><button class="btn" data-save type="button">브라우저에 저장</button><a class="btn line" href="${COMMUNITY}/">커뮤니티에서 질문</a><a class="btn line" href="${CLASSROOM}/courses">관련 강의 보기</a></div>${related.length ? `<section class="related"><h2>같이 보면 좋은 지식</h2><div class="related-grid">${related.map((y) => `<a href="/knowledge/${encodeURIComponent(y.slug)}">${esc(y.title)}</a>`).join("")}</div></section>` : ""}</main>${save}`;
  const canonical = `${SITE}/knowledge/${encodeURIComponent(x.slug)}`;
  return shell(`${x.title} | NEVER JUST SELL`, x.summary, canonical, body, { "@context":"https://schema.org", "@type":"Article", headline:x.title, description:x.summary, dateModified:x.updated, mainEntityOfPage:canonical, publisher:{ "@type":"Organization", name:"NEVER JUST SELL" } });
}

export function knowledgeSitemapXml(entries = LEGACY_KNOWLEDGE_ENTRIES) {
  const list = normalizeKnowledgeEntries(entries);
  return [`${SITE}/knowledge`, ...list.map((x) => `${SITE}/knowledge/${encodeURIComponent(x.slug)}`)];
}

export { LEGACY_KNOWLEDGE_ENTRIES };
