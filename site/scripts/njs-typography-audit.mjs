/**
 * NJS typography regression — measures actual browser layout, never string length.
 * This is a project-local WF-08 evaluator, not a globally installed Skill.
 * Execution: local V3.3 release preview server on port 8790, Node 22, installed Chrome.
 * Output: screenshots/typography-audit.json (candidate evidence).
 */
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.NJS_PREVIEW_ORIGIN || "http://127.0.0.1:8790";
const port = 9233;
const chromeBinary=process.env.CHROME_BIN || "google-chrome";
const routes=["/","/content","/knowledge","/class","/store","/support","/about","/book","/lecture"];
const viewports=[1440,1280,390,360,320];
const proc = spawn(chromeBinary,[
  "--headless=new","--disable-gpu","--no-sandbox","--disable-dev-shm-usage",
  "--hide-scrollbars","--no-first-run","--no-default-browser-check",
  "--remote-allow-origins=*","--remote-debugging-port="+port,
  "--user-data-dir=/tmp/njs-type-audit-"+process.pid,
  "about:blank"
],{stdio:"ignore"});
let ws,closed=false,seq=0;
const pending=new Map();
const evaluate=`(()=>{
const headings=[...document.querySelectorAll('h1,h2')].map(el=>{
const css=getComputedStyle(el),r=el.getBoundingClientRect(),lh=parseFloat(css.lineHeight);
return {tag:el.tagName,text:el.textContent.replace(/\\s+/g,' ').trim().slice(0,110),
fontPx:+parseFloat(css.fontSize).toFixed(2),lineHeightPx:+lh.toFixed(2),
lines:lh>0?Math.max(1,Math.round(r.height/lh)):null,width:+r.width.toFixed(2),
height:+r.height.toFixed(2),overflowX:el.scrollWidth>el.clientWidth+2,
clipped:css.textOverflow==='ellipsis'||css.webkitLineClamp!=='none'&&css.webkitLineClamp!==''};
});
const html=document.documentElement;
return {path:location.pathname,width:innerWidth,viewportWidth:html.clientWidth,
scrollWidth:html.scrollWidth,scrollOverflow:html.scrollWidth>html.clientWidth+2,
mainPresent:!!document.querySelector('main'),headings};
})()`;
function stop(){
 if(closed)return;closed=true;
 try{ws?.close()}catch{}
 try{proc.kill("SIGTERM")}catch{}
 for(const p of pending.values())p.reject(new Error("Chrome connection closed"));
 pending.clear();
}
function call(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++seq;
  const time=setTimeout(()=>{pending.delete(id);reject(new Error("CDP timeout "+method));},15000);
  pending.set(id,{resolve:x=>{clearTimeout(time);resolve(x);},reject:x=>{clearTimeout(time);reject(x);}});
  ws.send(JSON.stringify({id,method,params}));
 });
}
try{
 let ready=false;
 for(let n=0;n<60;n++){
  if(proc.exitCode!==null)throw Error("Chrome exited before remote debugging was ready");
  try{const r=await fetch("http://127.0.0.1:"+port+"/json/version");if(r.ok){ready=true;break}}catch{}
  await delay(200);
 }
 if(!ready)throw Error("Chrome remote debugging startup timeout");
 const target=await fetch("http://127.0.0.1:"+port+"/json/new?about:blank",{method:"PUT"}).then(r=>r.json());
 ws=new WebSocket(target.webSocketDebuggerUrl);
 ws.addEventListener("message",ev=>{
  const msg=JSON.parse(ev.data);if(!msg.id)return;
  const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);
  if(msg.error)p.reject(new Error(msg.error.message));else p.resolve(msg.result);
 });
 await new Promise((resolve,reject)=>{
  ws.addEventListener("open",resolve,{once:true});
  ws.addEventListener("error",reject,{once:true});
 });
 await call("Page.enable");await call("Runtime.enable");
 const reports=[];
 for(const width of viewports){
  await call("Emulation.setDeviceMetricsOverride",{width,height:1500,deviceScaleFactor:1,mobile:width<=640});
  for(const route of routes){
   await call("Page.navigate",{url:base+route});
   let stable=false;
   for(let n=0;n<70;n++){
    try{
     const r=await call("Runtime.evaluate",{expression:"location.pathname === "+JSON.stringify(route)+" && document.readyState==='complete' && !!document.querySelector('h1')",returnByValue:true});
     if(r.result?.value){stable=true;break}
    }catch{}
    await delay(100);
   }
   if(!stable)throw Error("Page load timed out "+width+" "+route);
   await call("Runtime.evaluate",{expression:"document.fonts.ready",awaitPromise:true,returnByValue:true});
   await delay(50);
   const data=await call("Runtime.evaluate",{expression:evaluate,returnByValue:true});
   const record={requestedWidth:width,route,...data.result.value};
   reports.push(record);
  }
 }
 // Exposed at screen zoom 200%. This is an exploratory signal, not a WCAG certification.
 const zoomChecks=[];
 await call("Emulation.setDeviceMetricsOverride",{width:320,height:1100,deviceScaleFactor:1,mobile:true});
 for(const route of ["/","/knowledge","/class","/about"]){
  await call("Page.navigate",{url:base+route});
  await delay(200);
  await call("Runtime.evaluate",{expression:"document.documentElement.style.fontSize='200%';document.fonts.ready",awaitPromise:true});
  await delay(120);
  const e=await call("Runtime.evaluate",{expression:evaluate,returnByValue:true});
  zoomChecks.push({route, ...e.result.value,scale:"root 200% inspection"});
 }
 const alerts=[];
 for(const report of reports){
  const h1=report.headings.filter(x=>x.tag==="H1");
  if(report.scrollOverflow)alerts.push({type:"horizontal-overflow",width:report.requestedWidth,route:report.route});
  for(const h of report.headings){
    if(h.clipped||h.overflowX)alerts.push({type:"title-clipped",width:report.requestedWidth,route:report.route,title:h.text});
    if(h.tag==="H1"&&h.lines>(report.requestedWidth>=390?3:4)){
      alerts.push({type:"long-h1",width:report.requestedWidth,route:report.route,lines:h.lines,title:h.text});
    }
  }
  if(h1.length!==1)alerts.push({type:"heading-count",width:report.requestedWidth,route:report.route,count:h1.length});
 }
 await mkdir("screenshots",{recursive:true});
 await writeFile("screenshots/typography-audit.json",JSON.stringify({auditedAt:new Date().toISOString(),base,normal:reports,zoom200:zoomChecks,alerts},null,2)+"\n");
 const severe=alerts.filter(x=>["horizontal-overflow","title-clipped","heading-count"].includes(x.type));
 console.log("TYPOGRAPHY_AUDIT",JSON.stringify({routes:routes.length,widths:viewports,measurements:reports.length,alerts:alerts.slice(0,30),severe:severe.length}));
 if(severe.length)process.exitCode=1;
}catch(e){console.error("Typography audit failed:",e.stack||e);process.exitCode=1}
finally{stop()}
