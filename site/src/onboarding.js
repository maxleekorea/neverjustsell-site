const SITE_ORIGIN = "https://www.neverjustsell.com";
const CLASSROOM_ORIGIN = "https://classroom.neverjustsell.com";
const COMMUNITY_ORIGIN = "https://community.neverjustsell.com";

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function safeSiteReturnTo(value, fallback = `${SITE_ORIGIN}/`) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) {
    return new URL(raw, SITE_ORIGIN).toString();
  }
  try {
    const target = new URL(raw);
    return target.origin === SITE_ORIGIN ? target.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function renderStartPage() {
  const loginUrl = `/login?return_to=${encodeURIComponent("/start")}`;
  const freeCourse = `${CLASSROOM_ORIGIN}/courses/online-commerce-basics`;
  const mySpace = `${CLASSROOM_ORIGIN}/my-space`;
  const community = `${COMMUNITY_ORIGIN}/`;
  const canonical = `${SITE_ORIGIN}/start`;

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>처음이라면 여기서 시작하세요 | NEVER JUST SELL</title>
<meta name="description" content="무료 지식, 무료 강의, 질문과 커뮤니티를 가장 짧은 순서로 경험하는 NEVER JUST SELL 시작 안내.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<style>
*{box-sizing:border-box}.start-page{background:#f7f4ef;color:#171512;min-height:100vh}.start-top{border-bottom:1px solid #ddd5cc;background:#fff}.start-top-inner,.start-shell{width:min(1040px,calc(100% - 40px));margin:0 auto}.start-top-inner{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:20px}.start-brand{font-size:13px;font-weight:850;letter-spacing:.15em;text-decoration:none;color:#171512}.start-top a:last-child{font-size:13px;color:#5f554c}.start-hero{padding:72px 0 46px}.start-kicker{font-size:11px;letter-spacing:.14em;font-weight:850;color:#765333;margin:0 0 12px}.start-hero h1{font-size:clamp(36px,7vw,68px);line-height:1.02;letter-spacing:-.055em;margin:0;max-width:780px}.start-lead{max-width:680px;margin:22px 0 0;color:#655d55;font-size:17px;line-height:1.75}.start-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}.start-btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 19px;border:1px solid #171512;border-radius:999px;text-decoration:none;font-size:14px;font-weight:800}.start-btn.primary{background:#171512;color:#fff}.start-btn.secondary{background:#fff;color:#171512}.start-proof{margin-top:18px;color:#81786f;font-size:12px}.start-steps{padding:22px 0 70px}.start-steps h2{font-size:clamp(25px,4vw,38px);letter-spacing:-.04em;margin:0 0 18px}.start-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.start-card{background:#fff;border:1px solid #ddd5cc;padding:25px;min-height:250px;display:flex;flex-direction:column}.start-no{font-size:11px;font-weight:850;letter-spacing:.12em;color:#765333}.start-card h3{font-size:23px;line-height:1.35;letter-spacing:-.035em;margin:18px 0 9px}.start-card p{color:#70675e;font-size:14px;line-height:1.7;margin:0 0 18px}.start-card a{margin-top:auto;color:#171512;font-size:13px;font-weight:800;text-underline-offset:4px}.start-note{margin-top:18px;padding:20px;border-left:3px solid #765333;background:#eee8e0;color:#5f574f;font-size:13px;line-height:1.7}.start-footer{border-top:1px solid #ddd5cc;padding:26px 0 42px;color:#7a7168;font-size:12px}.start-footer-inner{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}.start-footer a{color:inherit}@media(max-width:700px){.start-top-inner,.start-shell{width:calc(100% - 24px)}.start-top-inner{min-height:56px}.start-hero{padding:48px 0 28px}.start-lead{font-size:15px}.start-actions{display:grid;grid-template-columns:1fr}.start-btn{width:100%}.start-grid{grid-template-columns:1fr}.start-card{min-height:0;padding:20px}.start-card h3{font-size:20px}.start-steps{padding-bottom:48px}}
</style>
</head>
<body class="start-page">
<header class="start-top"><div class="start-top-inner"><a class="start-brand" href="/">NEVER JUST SELL</a><a href="/">홈으로</a></div></header>
<main>
<section class="start-hero"><div class="start-shell"><p class="start-kicker">START HERE</p><h1>처음이라면<br>이 순서로 시작하세요.</h1><p class="start-lead">강의를 사기 전에 먼저 무료 지식과 무료 강의를 확인해 보세요. 궁금한 점은 실제 Q&A와 커뮤니티에서 이어서 볼 수 있습니다. 회원가입은 무료입니다.</p><div class="start-actions"><a class="start-btn primary" href="${esc(loginUrl)}">회원가입 · 로그인하고 시작</a><a class="start-btn secondary" href="/knowledge">가입 전에 지식 허브 둘러보기</a></div><p class="start-proof">현재 강의 Q&A 23개와 커뮤니티 질문·사례·답변이 운영 중입니다.</p></div></section>
<section class="start-steps"><div class="start-shell"><h2>네 가지면 충분합니다.</h2><div class="start-grid">
<article class="start-card"><span class="start-no">01 · KNOWLEDGE</span><h3>3분 안에 하나만 읽어보세요.</h3><p>마케팅·온라인 커머스 용어, 실전 사례, 소비·마케팅 브리핑을 검색과 카드 방식으로 볼 수 있습니다.</p><a href="/knowledge">무료 지식 허브 보기 →</a></article>
<article class="start-card"><span class="start-no">02 · FREE CLASS</span><h3>무료 강의로 설명 방식을 확인하세요.</h3><p>온라인 유통을 단순 판매 기술이 아니라 유통·서비스·콘텐츠의 관점에서 설명하는 무료 강의입니다.</p><a href="${esc(freeCourse)}">무료 강의 신청하기 →</a></article>
<article class="start-card"><span class="start-no">03 · Q&A</span><h3>질문이 생기면 이미 쌓인 답부터 찾아보세요.</h3><p>유료 강의의 대표 Q&A와 커뮤니티의 온라인 판매 질문·사례·토론을 같은 생태계에서 연결합니다.</p><a href="${esc(community)}">질문과 토론 보기 →</a></article>
<article class="start-card"><span class="start-no">04 · MY SPACE</span><h3>가입한 뒤에는 내 공간에서 이어갑니다.</h3><p>신청한 강의, 참여 프로그램과 앞으로 연결될 디지털 콘텐츠를 한곳에서 다시 찾을 수 있습니다.</p><a href="${esc(mySpace)}">내 공간 열기 →</a></article>
</div><div class="start-note">처음부터 모든 메뉴를 볼 필요는 없습니다. 지식 하나를 읽거나 무료 강의 한 차시를 본 뒤, 궁금한 점이 생길 때 Q&A와 커뮤니티로 넘어가는 흐름을 권합니다.</div></div></section>
</main>
<footer class="start-footer"><div class="start-shell start-footer-inner"><span>NEVER JUST SELL · 맥작가</span><span><a href="/support">고객지원</a> · <a href="/knowledge">지식 허브</a> · <a href="${esc(community)}">커뮤니티</a></span></div></footer>
<script src="/app.js" defer></script>
</body>
</html>`;
}
