export async function focusProgramParticipant(response, request) {
  if (request.method !== "GET") return response;
  const url = new URL(request.url);
  if (!/^\/programs\/[^/]+\/?$/.test(url.pathname)) return response;
  if (response.status !== 200 || !String(response.headers.get("Content-Type") || "").includes("text/html")) return response;

  const body = await response.text();
  const formPattern = /<form method="post" action="\/programs\/[^\"]+\/missions\/[^\"]+\/submit">/g;
  let seen = false;
  let changed = false;
  const focused = body.replace(formPattern, (match) => {
    if (!seen) {
      seen = true;
      return match;
    }
    changed = true;
    return match.replace("<form ", '<form hidden data-deferred-mission-form="true" ');
  });

  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  headers.set("X-NJS-Program-Focus", changed ? "single-next-action" : "already-focused");
  return new Response(focused, { status: response.status, headers });
}
