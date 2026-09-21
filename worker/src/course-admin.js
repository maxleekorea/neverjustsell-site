const ADMIN_COOKIE = "njs_course_admin";
const ADMIN_TTL_SECONDS = 60 * 60 * 12;
const VIMEO_API_ORIGIN = "https://api.vimeo.com";
const TUS_VERSION = "1.0.0";

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function html(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  return new Response(body, { ...init, headers });
}

function parseCookies(request) {
  const result = {};
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

function b64urlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function b64urlDecode(text) {
  const normalized = text.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, function (ch) { return ch.charCodeAt(0); });
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function makeAdminToken(secret) {
  const payloadObject = {
    v: 1,
    exp: Math.floor(Date.now() / 1000) + ADMIN_TTL_SECONDS
  };
  const encoded = b64urlEncode(new TextEncoder().encode(JSON.stringify(payloadObject)));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), new TextEncoder().encode(encoded))
  );
  return encoded + "." + b64urlEncode(signature);
}

async function verifyAdminToken(token, secret) {
  if (!token || !secret) return false;
  const parts = String(token).split(".");
  if (parts.length !== 2) return false;
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      b64urlDecode(parts[1]),
      new TextEncoder().encode(parts[0])
    );
    if (!ok) return false;
    const decoded = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
    return decoded && decoded.v === 1 && Number(decoded.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

async function passwordMatches(provided, expected) {
  if (!expected) return false;
  const encoder = new TextEncoder();
  const digests = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(String(provided || ""))),
    crypto.subtle.digest("SHA-256", encoder.encode(String(expected)))
  ]);
  const a = new Uint8Array(digests[0]);
  const b = new Uint8Array(digests[1]);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function adminCookie(value) {
  return ADMIN_COOKIE + "=" + encodeURIComponent(value) +
    "; Path=/course-admin; Max-Age=" + ADMIN_TTL_SECONDS +
    "; HttpOnly; Secure; SameSite=Strict";
}

function expiredAdminCookie() {
  return ADMIN_COOKIE + "=; Path=/course-admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict";
}

async function isAdmin(request, env) {
  return verifyAdminToken(parseCookies(request)[ADMIN_COOKIE], env.COURSE_ADMIN_PASSWORD);
}

function redirect(location, cookie) {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 303, headers });
}

function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function shell(title, body) {
  return "<!doctype html><html lang=\"ko\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>" + escapeHtml(title) + " | NEVER JUST SELL</title>" +
    "<style>" +
    "*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#f5f5f5;font-family:Arial,'Noto Sans KR',sans-serif}" +
    "a{color:inherit}.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:36px 0 70px}" +
    ".top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:28px}" +
    ".brand{font-size:12px;font-weight:800;letter-spacing:.16em}.grid{display:grid;grid-template-columns:360px 1fr;gap:18px}" +
    ".card{background:#151515;border:1px solid #292929;border-radius:16px;padding:20px;margin-bottom:14px}" +
    "h1{font-size:30px;margin:0 0 8px}h2{font-size:18px;margin:0 0 14px}h3{margin:0 0 8px}" +
    "p{line-height:1.6}.muted{color:#999}.pill{display:inline-block;border:1px solid #333;border-radius:999px;padding:4px 8px;font-size:11px;color:#aaa;margin-right:5px}" +
    "label{display:block;font-size:12px;color:#aaa;margin:11px 0 6px}input,textarea,select,button{font:inherit;border-radius:9px}" +
    "input,textarea,select{width:100%;padding:11px 12px;background:#0d0d0d;border:1px solid #333;color:#fff}" +
    "textarea{min-height:86px;resize:vertical}button{padding:10px 14px;border:1px solid #333;background:#fff;color:#111;font-weight:800;cursor:pointer}" +
    "button.secondary{background:#181818;color:#ddd}.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lesson{padding:12px 0;border-top:1px solid #262626}" +
    ".error{color:#ff9696}.ok{color:#a8e6a8}.upload{margin-top:12px;padding:12px;border:1px solid #2b2b2b;border-radius:12px;background:#101010}.uploadbar{height:8px;background:#262626;border-radius:999px;overflow:hidden;margin-top:9px}.uploadbar span{display:block;height:100%;width:0;background:#eee;transition:width .15s}.uploadstatus{font-size:12px;color:#aaa;margin-top:7px}.upload button{margin-top:8px}.upload input{margin-top:6px}@media(max-width:800px){.grid{grid-template-columns:1fr}.row{grid-template-columns:1fr}}" +
    "</style></head><body><main class=\"wrap\">" + body + "</main></body></html>";
}

function loginPage(message) {
  const note = message ? "<p class=\"error\">" + escapeHtml(message) + "</p>" : "";
  return shell(
    "강의 관리자",
    "<div style=\"width:min(440px,100%);margin:7vh auto 0\" class=\"card\">" +
      "<div class=\"brand\">NEVER JUST SELL</div><h1>강의 관리자</h1>" +
      "<p class=\"muted\">관리자 비밀번호로 로그인하세요.</p>" + note +
      "<form method=\"post\" action=\"/course-admin/login\">" +
      "<label>관리자 비밀번호</label><input type=\"password\" name=\"password\" autocomplete=\"current-password\" required autofocus>" +
      "<button type=\"submit\" style=\"width:100%;margin-top:12px\">로그인</button></form></div>"
  );
}

async function listCourses(env) {
  const courseRows = await env.COURSE_DB.prepare(
    "SELECT id,slug,title,summary,access_type,cafe24_product_no,sales_enabled,visible,sort_order,status,price_krw,cafe24_sync_status,login_required,created_at,updated_at FROM courses ORDER BY sort_order,created_at"
  ).all();
  const lessonRows = await env.COURSE_DB.prepare(
    "SELECT id,course_id,module_id,title,vimeo_id,duration_seconds,sort_order,status,is_preview,created_at,updated_at FROM lessons ORDER BY course_id,sort_order,created_at"
  ).all();
  const courses = Array.isArray(courseRows.results) ? courseRows.results : [];
  const lessons = Array.isArray(lessonRows.results) ? lessonRows.results : [];
  const grouped = new Map();
  for (const lesson of lessons) {
    if (!grouped.has(lesson.course_id)) grouped.set(lesson.course_id, []);
    grouped.get(lesson.course_id).push(lesson);
  }
  return courses.map(function (course) {
    return { ...course, lessons: grouped.get(course.id) || [] };
  });
}

function courseCard(course) {
  const access = course.access_type === "paid" ? "유료" : "무료 · 로그인 필요";
  const price = Number(course.price_krw || 0);
  const lessonHtml = (course.lessons || []).map(function (lesson) {
    const vimeo = lesson.vimeo_id ? "Vimeo " + escapeHtml(lesson.vimeo_id) : "영상 미등록";
    const upload = lesson.vimeo_id ? "" :
      "<div class=\"upload\" data-vimeo-upload data-course-id=\"" + escapeHtml(course.id) + "\" data-lesson-id=\"" + escapeHtml(lesson.id) + "\" data-lesson-title=\"" + escapeHtml(lesson.title) + "\">" +
      "<label>영상 파일</label><input class=\"uploadfile\" type=\"file\" accept=\"video/*\">" +
      "<button class=\"uploadbutton\" type=\"button\">Vimeo 업로드</button>" +
      "<div class=\"uploadbar\"><span></span></div><div class=\"uploadstatus\">영상 파일을 선택하세요.</div></div>";
    return "<div class=\"lesson\"><strong>" + escapeHtml(lesson.title) + "</strong>" +
      "<div class=\"muted\" style=\"font-size:12px;margin-top:4px\">" + vimeo + " · " + escapeHtml(lesson.status) + "</div>" + upload + "</div>";
  }).join("");
  const published = course.status === "published" && Number(course.visible) === 1;
  const statusForm =
    "<form method=\"post\" action=\"/course-admin/course-status\" style=\"margin:12px 0\">" +
    "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
    "<input type=\"hidden\" name=\"action\" value=\"" + (published ? "unpublish" : "publish") + "\">" +
    "<button class=\"secondary\" type=\"submit\">" + (published ? "게시 중지" : "강의 게시") + "</button></form>";
  return "<section class=\"card\">" +
    "<h3>" + escapeHtml(course.title) + "</h3>" +
    "<div><span class=\"pill\">" + access + "</span><span class=\"pill\">" + escapeHtml(course.status) + "</span>" +
    (price > 0 ? "<span class=\"pill\">" + price.toLocaleString("ko-KR") + "원</span>" : "") + "</div>" +
    statusForm +
    "<p class=\"muted\">" + escapeHtml(course.summary || "") + "</p>" +
    lessonHtml +
    "<form method=\"post\" action=\"/course-admin/lessons\">" +
    "<input type=\"hidden\" name=\"course_id\" value=\"" + escapeHtml(course.id) + "\">" +
    "<label>차시 추가</label><div class=\"row\"><input name=\"title\" required placeholder=\"차시명\">" +
    "<button type=\"submit\">차시 추가</button></div></form></section>";
}

async function dashboardPage(env, message) {
  const courses = await listCourses(env);
  const cards = courses.length
    ? courses.map(courseCard).join("")
    : "<div class=\"card\"><p class=\"muted\">아직 등록된 강의가 없습니다.</p></div>";
  const note = message ? "<p class=\"ok\">" + escapeHtml(message) + "</p>" : "";
  return shell(
    "강의 관리자",
    "<div class=\"top\"><div><div class=\"brand\">NEVER JUST SELL · COURSE ADMIN</div><h1>강의 관리</h1></div>" +
      "<form method=\"post\" action=\"/course-admin/logout\"><button class=\"secondary\" type=\"submit\">로그아웃</button></form></div>" +
      note +
      "<div class=\"grid\"><section class=\"card\"><h2>새 강의</h2>" +
      "<form method=\"post\" action=\"/course-admin/courses\">" +
      "<label>강의명</label><input name=\"title\" required placeholder=\"네이버 쇼핑 - 키워드 전략\">" +
      "<label>URL 슬러그</label><input name=\"slug\" required placeholder=\"naver-keyword-strategy\">" +
      "<label>설명</label><textarea name=\"summary\"></textarea>" +
      "<div class=\"row\"><div><label>유형</label><select name=\"access_type\"><option value=\"public\">무료 · 로그인 필요</option><option value=\"paid\">유료</option></select></div>" +
      "<div><label>가격(원)</label><input name=\"price_krw\" type=\"number\" min=\"0\" step=\"1000\" value=\"0\"></div></div>" +
      "<button type=\"submit\" style=\"width:100%;margin-top:14px\">강의 만들기</button></form></section>" +
      "<section><h2>등록 강의</h2>" + cards + "</section></div>" +
      "<script src=\"/course-admin/app.js\" defer></script>"
  );
}

async function health(env) {
  if (!env.COURSE_DB) {
    return json({ ok: false, connected: false, error: "course_db_missing" }, { status: 503 });
  }
  try {
    const expected = ["course_modules", "courses", "lesson_progress", "lessons", "video_uploads"];
    const result = await env.COURSE_DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('course_modules','courses','lesson_progress','lessons','video_uploads') ORDER BY name"
    ).all();
    const tables = Array.isArray(result.results)
      ? result.results.map(function (row) { return row.name; }).filter(Boolean)
      : [];
    const missing = expected.filter(function (name) { return !tables.includes(name); });
    return json({
      ok: missing.length === 0,
      connected: true,
      database: "neverjustsell-courses",
      tables: tables,
      missing_tables: missing,
      admin_secret_configured: Boolean(env.COURSE_ADMIN_PASSWORD),
      vimeo_configured: Boolean(env.VIMEO_ACCESS_TOKEN)
    }, { status: missing.length === 0 ? 200 : 503 });
  } catch (error) {
    return json({
      ok: false,
      connected: true,
      error: "course_db_check_failed",
      detail: String(error && error.message ? error.message : error)
    }, { status: 502 });
  }
}

async function createCourse(form, env) {
  const title = String(form.get("title") || "").trim();
  const slug = slugify(form.get("slug"));
  const summary = String(form.get("summary") || "").trim();
  const accessType = form.get("access_type") === "paid" ? "paid" : "public";
  const priceKrw = Math.max(0, Number(form.get("price_krw") || 0) || 0);
  if (!title) throw new Error("강의명이 필요합니다.");
  if (!slug || !/^[a-z0-9가-힣][a-z0-9가-힣-]*$/.test(slug)) throw new Error("URL 슬러그가 올바르지 않습니다.");
  if (accessType === "paid" && priceKrw <= 0) throw new Error("유료 강의는 가격을 입력해야 합니다.");
  const id = crypto.randomUUID();
  await env.COURSE_DB.prepare(
    "INSERT INTO courses (id,slug,title,summary,access_type,price_krw,login_required,status,visible,sales_enabled,cafe24_sync_status) VALUES (?,?,?,?,?,?,1,'draft',0,0,'not_linked')"
  ).bind(id, slug, title, summary || null, accessType, Math.trunc(priceKrw)).run();
}

async function createLesson(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const title = String(form.get("title") || "").trim();
  if (!courseId || !title) throw new Error("강의와 차시명이 필요합니다.");
  const course = await env.COURSE_DB.prepare("SELECT id FROM courses WHERE id=?").bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");
  const orderRow = await env.COURSE_DB.prepare(
    "SELECT COALESCE(MAX(sort_order),-1)+1 AS next_order FROM lessons WHERE course_id=?"
  ).bind(courseId).first();
  const sortOrder = Number(orderRow && orderRow.next_order != null ? orderRow.next_order : 0);
  await env.COURSE_DB.prepare(
    "INSERT INTO lessons (id,course_id,title,sort_order,status) VALUES (?,?,?,?, 'draft')"
  ).bind(crypto.randomUUID(), courseId, title, sortOrder).run();
}



async function setCourseStatus(form, env) {
  const courseId = String(form.get("course_id") || "").trim();
  const action = String(form.get("action") || "").trim();
  const course = await env.COURSE_DB.prepare(
    "SELECT id,title,access_type,cafe24_product_no FROM courses WHERE id=?"
  ).bind(courseId).first();
  if (!course) throw new Error("강의를 찾을 수 없습니다.");

  if (action === "unpublish") {
    await env.COURSE_DB.prepare(
      "UPDATE courses SET visible=0,status='ready',updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(courseId).run();
    return "강의 게시를 중지했습니다.";
  }

  if (action !== "publish") throw new Error("잘못된 게시 요청입니다.");

  const lessons = await env.COURSE_DB.prepare(
    "SELECT id,vimeo_id,status FROM lessons WHERE course_id=? AND status!='archived' ORDER BY sort_order,created_at"
  ).bind(courseId).all();
  const rows = Array.isArray(lessons.results) ? lessons.results : [];
  if (rows.length === 0) throw new Error("게시하려면 차시가 하나 이상 필요합니다.");
  if (rows.some((lesson) => !lesson.vimeo_id)) {
    throw new Error("모든 차시에 영상을 연결한 뒤 게시해 주세요.");
  }
  if (course.access_type === "paid" && !(Number(course.cafe24_product_no) > 0)) {
    throw new Error("유료 강의는 Cafe24 상품 연결 후 게시할 수 있습니다.");
  }

  await env.COURSE_DB.prepare(
    "UPDATE lessons SET status=CASE WHEN status IN ('draft','uploading','processing') THEN 'ready' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE course_id=? AND vimeo_id IS NOT NULL"
  ).bind(courseId).run();
  await env.COURSE_DB.prepare(
    "UPDATE courses SET visible=1,status='published',updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(courseId).run();
  return "강의를 게시했습니다.";
}

function javascript(body, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/javascript; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(body, { ...init, headers });
}

function adminClientScript() {
  return [
    "(function(){",
    "\"use strict\";",
    "const TUS_VERSION='1.0.0';",
    "const CHUNK_SIZE=8*1024*1024;",
    "async function api(path,options){",
    "  const response=await fetch(path,Object.assign({},options||{}, {headers:Object.assign({'Content-Type':'application/json'},(options&&options.headers)||{})}));",
    "  const body=await response.json().catch(function(){return {};});",
    "  if(!response.ok) throw new Error(body.detail||body.error||('HTTP '+response.status));",
    "  return body;",
    "}",
    "async function getOffset(url){",
    "  const response=await fetch(url,{method:'HEAD',headers:{'Tus-Resumable':TUS_VERSION}});",
    "  if(!response.ok) throw new Error('Vimeo 업로드 위치 확인 실패 ('+response.status+')');",
    "  return Number(response.headers.get('Upload-Offset')||0);",
    "}",
    "function patchChunk(url,blob,offset,onProgress){",
    "  return new Promise(function(resolve,reject){",
    "    const xhr=new XMLHttpRequest();",
    "    xhr.open('PATCH',url);",
    "    xhr.setRequestHeader('Tus-Resumable',TUS_VERSION);",
    "    xhr.setRequestHeader('Upload-Offset',String(offset));",
    "    xhr.setRequestHeader('Content-Type','application/offset+octet-stream');",
    "    xhr.upload.onprogress=function(event){if(event.lengthComputable) onProgress(offset+event.loaded);};",
    "    xhr.onload=function(){",
    "      if(xhr.status>=200&&xhr.status<300){resolve(Number(xhr.getResponseHeader('Upload-Offset')||offset+blob.size));}",
    "      else reject(new Error('Vimeo 업로드 실패 ('+xhr.status+')'));",
    "    };",
    "    xhr.onerror=function(){reject(new Error('Vimeo 업로드 네트워크 오류'));};",
    "    xhr.send(blob);",
    "  });",
    "}",
    "async function uploadTus(url,file,onProgress){",
    "  let offset=0;",
    "  try{offset=await getOffset(url);}catch(_){offset=0;}",
    "  while(offset<file.size){",
    "    const end=Math.min(offset+CHUNK_SIZE,file.size);",
    "    offset=await patchChunk(url,file.slice(offset,end),offset,onProgress);",
    "  }",
    "}",
    "async function startUpload(box){",
    "  const input=box.querySelector('.uploadfile');",
    "  const button=box.querySelector('.uploadbutton');",
    "  const status=box.querySelector('.uploadstatus');",
    "  const bar=box.querySelector('.uploadbar span');",
    "  const file=input&&input.files&&input.files[0];",
    "  if(!file){status.textContent='영상 파일을 먼저 선택하세요.';return;}",
    "  button.disabled=true;input.disabled=true;",
    "  try{",
    "    status.textContent='Vimeo 업로드 세션 생성 중…';",
    "    const started=await api('/course-admin/api/vimeo/start',{method:'POST',body:JSON.stringify({course_id:box.dataset.courseId,lesson_id:box.dataset.lessonId,file_name:file.name,file_size:file.size,name:box.dataset.lessonTitle})});",
    "    status.textContent='Vimeo 업로드 0%';",
    "    await uploadTus(started.upload_link,file,function(done){",
    "      const pct=Math.max(0,Math.min(100,Math.round(done/file.size*100)));",
    "      bar.style.width=pct+'%';status.textContent='Vimeo 업로드 '+pct+'%';",
    "    });",
    "    status.textContent='업로드 완료 · Vimeo 처리 상태 확인 중…';",
    "    const completed=await api('/course-admin/api/vimeo/complete',{method:'POST',body:JSON.stringify({upload_id:started.upload_id})});",
    "    bar.style.width='100%';",
    "    status.textContent=completed.status==='ready'?'영상 등록 완료':'업로드 완료 · Vimeo 인코딩 처리 중';",
    "    setTimeout(function(){location.reload();},900);",
    "  }catch(error){",
    "    status.textContent=error&&error.message?error.message:String(error);",
    "    status.classList.add('error');button.disabled=false;input.disabled=false;",
    "  }",
    "}",
    "document.addEventListener('click',function(event){",
    "  const button=event.target.closest('.uploadbutton');",
    "  if(!button) return;",
    "  const box=button.closest('[data-vimeo-upload]');",
    "  if(box) startUpload(box);",
    "});",
    "})();"
  ].join("\n");
}

function vimeoHeaders(env, hasBody) {
  const headers = {
    Authorization: "Bearer " + String(env.VIMEO_ACCESS_TOKEN || "").trim(),
    Accept: "application/vnd.vimeo.*+json;version=3.4"
  };
  if (hasBody) headers["Content-Type"] = "application/json";
  return headers;
}

async function vimeoRequest(path, env, init = {}) {
  const response = await fetch(VIMEO_API_ORIGIN + path, {
    ...init,
    headers: { ...vimeoHeaders(env, Boolean(init.body)), ...(init.headers || {}) }
  });
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) {
    throw new Error("Vimeo API failed (" + response.status + "): " + JSON.stringify(payload));
  }
  return payload;
}

function vimeoVideoId(uri) {
  const match = String(uri || "").match(/\/videos\/(\d+)/);
  return match ? match[1] : null;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function startVimeoUpload(body, env) {
  if (!env.VIMEO_ACCESS_TOKEN) throw new Error("Vimeo 연결이 필요합니다.");

  const courseId = String(body && body.course_id || "").trim();
  const lessonId = String(body && body.lesson_id || "").trim();
  const fileName = String(body && body.file_name || "").trim();
  const fileSize = Number(body && body.file_size || 0);
  const videoName = String(body && body.name || fileName || "강의 영상").trim();

  if (!courseId || !lessonId || !fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
    throw new Error("업로드 정보가 부족합니다.");
  }

  const lesson = await env.COURSE_DB
    .prepare("SELECT id,course_id,vimeo_id FROM lessons WHERE id=?")
    .bind(lessonId)
    .first();

  if (!lesson || lesson.course_id !== courseId) throw new Error("차시 정보가 일치하지 않습니다.");
  if (lesson.vimeo_id) throw new Error("이미 Vimeo 영상이 연결된 차시입니다.");

  const video = await vimeoRequest("/me/videos", env, {
    method: "POST",
    body: JSON.stringify({
      name: videoName,
      privacy: { view: "disable" },
      upload: { approach: "tus", size: Math.trunc(fileSize) }
    })
  });

  const vimeoId = vimeoVideoId(video && video.uri);
  const uploadLink = video && video.upload && video.upload.upload_link;
  if (!vimeoId || !uploadLink) throw new Error("Vimeo 업로드 세션 생성에 실패했습니다.");

  const uploadId = crypto.randomUUID();
  await env.COURSE_DB.prepare(
    "INSERT INTO video_uploads (id,course_id,lesson_id,file_name,file_size,vimeo_id,vimeo_uri,upload_status) VALUES (?,?,?,?,?,?,?, 'uploading')"
  ).bind(uploadId, courseId, lessonId, fileName, Math.trunc(fileSize), vimeoId, video.uri).run();

  await env.COURSE_DB.prepare(
    "UPDATE lessons SET vimeo_id=?,status='uploading',updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(vimeoId, lessonId).run();

  return {
    upload_id: uploadId,
    upload_link: uploadLink,
    vimeo_id: vimeoId,
    tus_version: TUS_VERSION
  };
}

async function completeVimeoUpload(body, env) {
  const uploadId = String(body && body.upload_id || "").trim();
  if (!uploadId) throw new Error("업로드 ID가 필요합니다.");

  const upload = await env.COURSE_DB.prepare(
    "SELECT id,lesson_id,vimeo_id FROM video_uploads WHERE id=?"
  ).bind(uploadId).first();

  if (!upload) throw new Error("업로드 기록을 찾을 수 없습니다.");

  const video = await vimeoRequest("/videos/" + encodeURIComponent(upload.vimeo_id), env, { method: "GET" });
  const duration = Number(video && video.duration || 0) || null;
  const transcodeStatus = video && video.transcode && video.transcode.status || null;
  const ready = transcodeStatus === "complete";
  const status = ready ? "ready" : "processing";

  await env.COURSE_DB.prepare(
    "UPDATE video_uploads SET upload_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(status, uploadId).run();

  await env.COURSE_DB.prepare(
    "UPDATE lessons SET duration_seconds=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?"
  ).bind(duration, status, upload.lesson_id).run();

  return {
    upload_id: uploadId,
    vimeo_id: upload.vimeo_id,
    status,
    transcode_status: transcodeStatus,
    duration_seconds: duration
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/course-admin/health") return health(env);

    if (!env.COURSE_ADMIN_PASSWORD) {
      return json({ ok: false, error: "course_admin_secret_missing" }, { status: 503 });
    }

    if (url.pathname === "/course-admin/login" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      const form = await request.formData().catch(function () { return null; });
      const password = form ? form.get("password") : "";
      if (!await passwordMatches(password, env.COURSE_ADMIN_PASSWORD)) {
        return html(loginPage("비밀번호가 올바르지 않습니다."), { status: 401 });
      }
      return redirect("/course-admin", adminCookie(await makeAdminToken(env.COURSE_ADMIN_PASSWORD)));
    }

    if (url.pathname === "/course-admin/logout" && request.method === "POST") {
      return redirect("/course-admin", expiredAdminCookie());
    }

    const authenticated = await isAdmin(request, env);

    if (url.pathname === "/course-admin" && request.method === "GET") {
      if (!authenticated) return html(loginPage(""));
      if (!env.COURSE_DB) return json({ ok: false, error: "course_db_missing" }, { status: 503 });
      return html(await dashboardPage(env, url.searchParams.get("message") || ""));
    }

    if (url.pathname === "/course-admin/app.js" && request.method === "GET") {
      if (!authenticated) return javascript("/* admin auth required */", { status: 401 });
      return javascript(adminClientScript());
    }

    if (!authenticated) {
      return json({ ok: false, error: "admin_auth_required" }, { status: 401 });
    }

    if (!env.COURSE_DB) {
      return json({ ok: false, error: "course_db_missing" }, { status: 503 });
    }

    if (url.pathname === "/course-admin/courses" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await createCourse(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("강의를 만들었습니다."));
      } catch (error) {
        return html(loginPage(String(error && error.message ? error.message : error)), { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/course-status" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        const message = await setCourseStatus(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent(message));
      } catch (error) {
        return redirect("/course-admin?message=" + encodeURIComponent(String(error && error.message ? error.message : error)));
      }
    }

    if (url.pathname === "/course-admin/lessons" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        await createLesson(await request.formData(), env);
        return redirect("/course-admin?message=" + encodeURIComponent("차시를 추가했습니다."));
      } catch (error) {
        return json({ ok: false, error: "course_admin_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/start" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await startVimeoUpload(await readJson(request), env)) }, { status: 201 });
      } catch (error) {
        return json({ ok: false, error: "vimeo_upload_start_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    if (url.pathname === "/course-admin/api/vimeo/complete" && request.method === "POST") {
      if (!sameOrigin(request)) return json({ ok: false, error: "origin_rejected" }, { status: 403 });
      try {
        return json({ ok: true, ...(await completeVimeoUpload(await readJson(request), env)) });
      } catch (error) {
        return json({ ok: false, error: "vimeo_upload_complete_failed", detail: String(error && error.message ? error.message : error) }, { status: 400 });
      }
    }

    return json({ ok: false, error: "not_found" }, { status: 404 });
  }
};
