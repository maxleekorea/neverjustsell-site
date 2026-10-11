import assert from "node:assert/strict";
import { onRequest } from "../community/functions/[[path]].js";
import {validCustomerReturn,validCommunityReturn} from "../worker/src/config.js";
import {programLoginRedirect} from "../worker/src/program-participant.js";

const C="https://community.neverjustsell.com";
const AUTH="https://classroom.neverjustsell.com";
const env={
  DB:{prepare(){throw Error("Unauthenticated entrance must not query membership tables");}},
  SITE_ORIGIN:C,AUTH_BRIDGE_ORIGIN:AUTH
};
function ctx(path,method="GET"){
  return {
    request:new Request(new URL(path,C),{method}),
    env,waitUntil(){},params:{},data:{}
  };
}
function pathFromLoginRedirect(response){
  assert.equal(response.status,302);
  const url=new URL(response.headers.get("Location"),C);
  assert.equal(url.origin,C);
  assert.equal(url.pathname,"/login");
  return url.searchParams.get("return_to");
}
async function firstIntent(intent){
  const requested="/write?intent="+intent;
  const response=await onRequest(ctx(requested));
  assert.equal(pathFromLoginRedirect(response),requested,"keep clicked writing mode");
  const login=await onRequest(ctx("/login?return_to="+encodeURIComponent(requested)));
  assert.equal(login.status,302);
  const providerStart=new URL(login.headers.get("Location"));
  assert.equal(providerStart.origin,AUTH);
  assert.equal(providerStart.pathname,"/oauth/cafe24/customer/start");
  const callback=new URL(providerStart.searchParams.get("return_to"));
  assert.equal(callback.origin,C);
  assert.equal(callback.pathname,"/auth/callback");
  assert.equal(callback.searchParams.get("return_to"),requested);
  assert.ok(validCommunityReturn(callback.toString(),{}),"keep restricted callback origin/route");
}
await firstIntent("question");
await firstIntent("case");

const plain=await onRequest(ctx("/write"));
assert.equal(pathFromLoginRedirect(plain),"/write","plain writing remains plain");
for(const evil of ["//evil.example","/\\evil.example","https://evil.example/","/\nLocation:https://evil.example"]){
  const login=await onRequest(ctx("/login?return_to="+encodeURIComponent(evil)));
  assert.equal(login.status,302);
  const start=new URL(login.headers.get("Location"));
  const callback=new URL(start.searchParams.get("return_to"));
  assert.equal(callback.searchParams.get("return_to"),"/","bad external returns must be reset");
}
assert.equal(validCustomerReturn(AUTH+"/my-space"),AUTH+"/my-space");
assert.equal(validCustomerReturn(AUTH+"/library"),AUTH+"/library");
assert.equal(validCustomerReturn(AUTH+"/classroom?course=online-commerce-basics"),AUTH+"/classroom?course=online-commerce-basics");
assert.equal(validCustomerReturn("https://evil.example/my-space"),null);
assert.equal(validCustomerReturn(AUTH+"/oauth/cafe24/customer/start"),null);

// Program participation uses the SAME customer OAuth return contract; GET may resume,
// but a submitted POST must not be repeated after login.
for (const path of ["/programs", "/programs/", "/programs/run-1?from=my-space"]) {
  assert.equal(validCustomerReturn(AUTH+path),AUTH+path);
  const response=programLoginRedirect(new Request(AUTH+path));
  assert.equal(response.status,303,"guest program access should redirect to existing Cafe24 bridge");
  const auth=new URL(response.headers.get("Location"));
  assert.equal(auth.origin,AUTH);
  assert.equal(auth.pathname,"/oauth/cafe24/customer/start");
  assert.equal(auth.searchParams.get("return_to"),AUTH+path);
}
assert.equal(validCustomerReturn(AUTH+"/programs/run-1/missions/mission-1/submit"),null);
assert.equal(validCustomerReturn("https://evil.example/programs/run-1"),null);
const missionPost=programLoginRedirect(new Request(AUTH+"/programs/run-1/missions/mission-1/submit",{method:"POST"}));
assert.equal(new URL(missionPost.headers.get("Location")).searchParams.get("return_to"),AUTH+"/programs","mission POST must not replay after login");
assert.equal(validCommunityReturn("https://evil.example/auth/callback",{}),null);
console.log("PASS: guest question/case intent + safe classroom return paths + cross-site denial");
