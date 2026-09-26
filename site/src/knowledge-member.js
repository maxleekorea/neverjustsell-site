const CLASSROOM_ORIGIN = "https://classroom.neverjustsell.com";
const API_URL = `${CLASSROOM_ORIGIN}/knowledge/saves`;

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function jsonForScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderSavedKnowledgePage(entries = []) {
  const cards = entries.map((item) => `
    <a class="saved-card" data-saved-card data-slug="${esc(item.slug)}" href="/knowledge/${encodeURIComponent(item.slug)}" hidden>
      <div class="saved-meta">${esc(item.type === "term" ? "용어" : item.type === "case" ? "사례" : "브리핑")} · ${esc(item.updated || "")}</div>
      <h2>${esc(item.title)}</h2>
      <p>${esc(item.summary)}</p>
      <span>다시 보기 →</span>
    </a>`).join("");

  const loginReturn = "/knowledge/saved";
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>내 학습함 | NEVER JUST SELL</title><style>
  :root{--ink:#171512;--muted:#746c64;--line:#ddd5cb;--paper:#f7f4ef;--accent:#765333}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,"Noto Sans KR",sans-serif;line-height:1.65}a{color:inherit}.shell{width:min(1040px,calc(100% - 32px));margin:auto}.top{height:64px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{text-decoration:none;font-size:13px;font-weight:850;letter-spacing:.13em}.back{font-size:13px;color:var(--muted)}main{padding:58px 0 80px}.kicker{font-size:11px;font-weight:850;letter-spacing:.14em;color:var(--accent)}h1{font-size:clamp(34px,6vw,58px);line-height:1.08;letter-spacing:-.045em;margin:11px 0 14px}.lead{max-width:650px;color:var(--muted);margin:0}.status{margin:28px 0 15px;padding:15px 17px;background:#fff;border:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:14px}.status strong{font-size:14px}.status span{font-size:12px;color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.saved-card{background:#fff;border:1px solid var(--line);padding:22px;text-decoration:none;min-height:210px;display:flex;flex-direction:column}.saved-card:hover{border-color:#a79583}.saved-meta{font-size:11px;font-weight:800;color:var(--accent)}.saved-card h2{font-size:20px;line-height:1.4;margin:14px 0 8px}.saved-card p{font-size:14px;color:var(--muted);margin:0 0 18px}.saved-card span{margin-top:auto;font-size:12px;font-weight:800}.empty{display:none;padding:42px 20px;border:1px dashed #cfc4b8;text-align:center;color:var(--muted);background:#fbfaf8}.empty strong{display:block;color:var(--ink);font-size:18px;margin-bottom:7px}.empty a{display:inline-block;margin-top:14px;padding:10px 14px;border-radius:999px;background:var(--ink);color:#fff;text-decoration:none;font-size:13px;font-weight:800}.error{display:none;margin-top:18px;color:#8b352d}.loading{margin-top:24px;color:var(--muted)}@media(max-width:620px){.shell{width:calc(100% - 20px)}.top{height:58px}main{padding:36px 0 60px}.grid{grid-template-columns:1fr}.status{align-items:flex-start;flex-direction:column}.saved-card{min-height:0;padding:18px}}
  </style></head><body><header class="shell top"><a class="brand" href="/">NEVER JUST SELL</a><a class="back" href="/knowledge">지식 허브</a></header><main class="shell"><div class="kicker">MY KNOWLEDGE</div><h1>내 학습함</h1><p class="lead">회원 계정에 저장한 용어·사례·브리핑을 다시 찾는 공간입니다. 브라우저가 바뀌어도 같은 계정으로 이어집니다.</p><div class="status" id="saved-status" hidden><strong id="saved-title">저장한 지식</strong><span id="saved-count"></span></div><p class="loading" id="saved-loading">저장한 지식을 불러오는 중입니다.</p><p class="error" id="saved-error">학습함을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><div class="grid" id="saved-grid">${cards}</div><div class="empty" id="saved-empty"><strong id="saved-empty-title">저장한 지식이 없습니다.</strong><span id="saved-empty-copy">지식 허브에서 필요한 내용을 저장하면 여기에 모입니다.</span><br><a id="saved-empty-action" href="/knowledge">지식 둘러보기</a></div></main><script>
  (async function(){const api=${jsonForScript(API_URL)},cards=[...document.querySelectorAll('[data-saved-card]')],loading=document.querySelector('#saved-loading'),error=document.querySelector('#saved-error'),empty=document.querySelector('#saved-empty'),status=document.querySelector('#saved-status'),count=document.querySelector('#saved-count'),emptyTitle=document.querySelector('#saved-empty-title'),emptyCopy=document.querySelector('#saved-empty-copy'),emptyAction=document.querySelector('#saved-empty-action');try{const r=await fetch(api,{credentials:'include',headers:{Accept:'application/json'},cache:'no-store'});loading.style.display='none';if(r.status===401){status.hidden=false;count.textContent='로그인 필요';empty.style.display='block';emptyTitle.textContent='로그인하면 저장한 지식을 이어볼 수 있습니다.';emptyCopy.textContent='무료 회원 계정에 저장되므로 다른 기기에서도 같은 학습함을 사용할 수 있습니다.';emptyAction.textContent='로그인';emptyAction.href='/login?return_to='+encodeURIComponent(${jsonForScript(loginReturn)});return}if(!r.ok)throw new Error('load_failed');const data=await r.json(),saved=new Set(Array.isArray(data.saved_slugs)?data.saved_slugs:[]);let shown=0;cards.forEach(c=>{if(saved.has(c.dataset.slug)){c.hidden=false;shown++}});status.hidden=false;count.textContent=shown+'개 저장';if(!shown)empty.style.display='block'}catch(_){loading.style.display='none';error.style.display='block'}})();
  </script></body></html>`;
}

export async function injectKnowledgeMemberIndex(response) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const body = await response.text();
  if (body.includes('id="njs-knowledge-member-link"')) return new Response(body, { status: response.status, headers: response.headers });
  const marker = '<div class="meta">';
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });
  const bar = `<div id="njs-knowledge-member-link" style="display:flex;justify-content:flex-end;padding:16px 0 0"><a href="/knowledge/saved" style="display:inline-flex;align-items:center;gap:7px;border:1px solid #ddd5cb;background:#fff;border-radius:999px;padding:9px 13px;text-decoration:none;font-size:13px;font-weight:800">내 학습함 <span aria-hidden="true">→</span></a></div>`;
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, bar + marker), { status: response.status, headers });
}

export async function injectMemberSaveControl(response, request) {
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/knowledge/") || url.pathname === "/knowledge/saved") return response;
  const slug = decodeURIComponent(url.pathname.slice("/knowledge/".length)).replace(/\/$/, "");
  if (!slug) return response;
  const body = await response.text();
  if (!body.includes("data-save") || body.includes("njs-member-knowledge-save")) return new Response(body, { status: response.status, headers: response.headers });

  const script = `<script id="njs-member-knowledge-save">(function(){const api=${jsonForScript(API_URL)},slug=${jsonForScript(slug)},b=document.querySelector('[data-save]'),toast=document.querySelector('#toast');if(!b)return;b.onclick=null;let authenticated=false,saved=false;const say=t=>{if(!toast)return;toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1200)};function paint(){b.textContent=!authenticated?'로그인 후 저장':(saved?'저장됨 · 해제':'내 학습함에 저장')}async function load(){try{const r=await fetch(api,{credentials:'include',headers:{Accept:'application/json'},cache:'no-store'});if(r.status===401){authenticated=false;paint();return}if(!r.ok)throw new Error();const j=await r.json();authenticated=true;saved=Array.isArray(j.saved_slugs)&&j.saved_slugs.includes(slug);paint()}catch(_){b.textContent='저장 다시 시도'}}b.addEventListener('click',async function(e){e.preventDefault();if(!authenticated){location.href='/login?return_to='+encodeURIComponent(location.pathname+location.search);return}b.disabled=true;try{const r=await fetch(api,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({slug,action:'toggle'})});if(r.status===401){authenticated=false;paint();location.href='/login?return_to='+encodeURIComponent(location.pathname+location.search);return}if(!r.ok)throw new Error();const j=await r.json();saved=Boolean(j.saved_now);paint();say(saved?'내 학습함에 저장했습니다.':'저장을 해제했습니다.')}catch(_){say('저장하지 못했습니다. 다시 시도해 주세요.')}finally{b.disabled=false}});load()})();</script>`;
  const marker = "</body>";
  if (!body.includes(marker)) return new Response(body, { status: response.status, headers: response.headers });
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  return new Response(body.replace(marker, script + marker), { status: response.status, headers });
}
