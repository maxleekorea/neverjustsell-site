import {
  classroomMobileUxMarkup,
  classroomMobileUxScript,
  injectClassroomMobileUx
} from "../worker/src/classroom-mobile-ux.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const markup = classroomMobileUxMarkup();
const script = classroomMobileUxScript();

assert(markup.includes("mobile-service-nav"), "mobile navigation drawer style missing");
assert(markup.includes("curriculum-drawer"), "collapsible curriculum style missing");
assert(markup.includes('/classroom/mobile-learning.js'), "mobile learning script asset missing");
assert(script.includes("전체 커리큘럼"), "curriculum drawer label missing");
assert(script.includes("video.insertAdjacentElement('afterend',nav)"), "video-first lesson navigation reorder missing");
assert(script.includes("desktopNav.querySelectorAll('a')"), "mobile service navigation cloning missing");

const source = new Response('<!doctype html><html><head><title>x</title></head><body><main>ok</main></body></html>', {
  status: 200,
  headers: { "Content-Type": "text/html; charset=utf-8" }
});
const injected = await injectClassroomMobileUx(source);
const body = await injected.text();
assert(body.includes('/classroom/mobile-learning.js'), "classroom HTML injection missing");
assert(body.indexOf('/classroom/mobile-learning.js') < body.indexOf('</head>'), "mobile UX asset must be injected in head");

const jsonResponse = new Response('{}', { status: 200, headers: { "Content-Type": "application/json" } });
const untouched = await injectClassroomMobileUx(jsonResponse);
assert(await untouched.text() === '{}', "non-HTML response must stay untouched");

console.log("PASS: classroom mobile UX contract");
