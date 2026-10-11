import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
const src=readFileSync(new URL("../cafe24/visitor-login/visitor-login.js",import.meta.url),"utf8");
const sandbox={URL,URLSearchParams};runInNewContext(src,sandbox);
const {isNjsLearningLogin,install}=sandbox.NJSVisitorLoginUX;
const BASE="https://neverjustsell.cafe24.com/member/login.html";
const CALLBACK="https://classroom.neverjustsell.com/oauth/cafe24/callback";
const oauth="/api/v2/oauth/authorize?"+new URLSearchParams({
  client_id:"test-client",state:"test-state",response_type:"code",
  scope:"mall.read_customer_identifier",redirect_uri:CALLBACK
}).toString();
const valid=BASE+"?returnUrl="+encodeURIComponent(oauth);
assert.equal(isNjsLearningLogin(valid),true);
// Cafe24 live login URL sometimes double-encodes the nested callback address.
const doubleEncoded="/api/v2/oauth/authorize?"+new URLSearchParams({
  client_id:"test-client",state:"test-state",response_type:"code",
  scope:"mall.read_customer_identifier",redirect_uri:encodeURIComponent(encodeURIComponent(CALLBACK))
}).toString();
assert.equal(isNjsLearningLogin(BASE+"?returnUrl="+encodeURIComponent(doubleEncoded)),true);
for(const raw of [
  "", "/myshop/order/list.html",
  "https://evil.example/api/v2/oauth/authorize?client_id=x&state=y&response_type=code",
  "//evil.example/api/v2/oauth/authorize?client_id=x&state=y&response_type=code",
  "/api/v2/oauth/authorize?client_id=x&response_type=code",
  oauth.replace("mall.read_customer_identifier","mall.read_order"),
  oauth.replace(encodeURIComponent(CALLBACK),encodeURIComponent("https://external.example/oauth/cafe24/callback")),
  oauth.replace(encodeURIComponent(CALLBACK),encodeURIComponent("https://classroom.neverjustsell.com/other-path"))
]) {
  assert.equal(isNjsLearningLogin(BASE+"?returnUrl="+encodeURIComponent(raw)),false,"must isolate NJS learning login from commerce/other OAuth");
}
assert.equal(isNjsLearningLogin("https://other.example/member/login.html?returnUrl="+encodeURIComponent(oauth)),false);
assert.equal(install(null,valid),false);
const inserted=[];
function node(tag) {return {tag,children:[],attributes:{},appendChild(child){this.children.push(child)},setAttribute(k,v){this.attributes[k]=v}}}
const parent={insertBefore(what,before){inserted.push({what,before})}};
const login={parentElement:parent};
const doc={title:"original",documentElement:{classList:{add(k){this.name=k}}},getElementById(id){return inserted.find(x=>x.what.id===id)?.what||null},querySelector(s){return s===".xans-member-login"?login:null},createElement:node};
assert.equal(install(doc,BASE),false);
assert.equal(inserted.length,0,"normal commerce login must not be touched");
assert.equal(install(doc,valid),true);
assert.equal(inserted.length,1);
assert.equal(inserted[0].before,login,"must not replace Cafe24 authentication module");
assert.equal(doc.title,"NJS 회원 로그인 | NEVER JUST SELL");
assert.equal(install(doc,valid),true);
assert.equal(inserted.length,1,"guide must be idempotent");
const css=readFileSync(new URL("../cafe24/visitor-login/visitor-login.css",import.meta.url),"utf8");
assert.match(css,/html\.njs-visitor-login \[data-njs-commerce-only\]/);
assert.ok(!src.includes("form.submit(") && !src.includes("fetch(") && !src.includes("localStorage"));
console.log("PASS NJS OAuth-only visitor login skin helper; standard commerce login remains unchanged");
