const API="https://api.cloudflare.com/client/v4";
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!token) throw new Error("Missing CLOUDFLARE_API_TOKEN");
async function cf(path){
  const r=await fetch(API+path,{headers:{Authorization:`Bearer ${token}`}});
  const j=await r.json();
  if(!r.ok||j.success===false) throw new Error(`${path}: ${r.status} ${JSON.stringify(j.errors||j)}`);
  return j.result;
}
const zone=(await cf("/zones?name=neverjustsell.com&status=active&per_page=10"))[0];
if(!zone) throw new Error("zone missing");
console.log("ZONE",zone.id,zone.name,"account",zone.account?.id||"");
const domains=await cf(`/accounts/${zone.account.id}/workers/domains`);
console.log("WORKER_DOMAINS");
for(const d of domains.filter(d=>d.hostname?.endsWith("neverjustsell.com"))) console.log(d.hostname,"->",d.service,d.environment||"");
console.log("DNS");
for(const name of ["neverjustsell.com","www.neverjustsell.com","classroom.neverjustsell.com","community.neverjustsell.com"]){
  const rs=await cf(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(name)}&per_page=100`);
  console.log(name,rs.map(r=>({type:r.type,content:r.content,proxied:r.proxied,comment:r.comment||null})));
}
async function probe(url){
  try{
    const r=await fetch(url,{redirect:"manual",headers:{"user-agent":"neverjustsell-diagnostic/1.0"}});
    const text=await r.text();
    console.log("HTTP",url,"status",r.status,"location",r.headers.get("location"),"server",r.headers.get("server"),"cf-ray",Boolean(r.headers.get("cf-ray")),"snippet",text.slice(0,120).replace(/\s+/g," "));
  }catch(e){console.log("HTTP_ERR",url,String(e));}
}
for(const url of [
  "https://www.neverjustsell.com/",
  "https://www.neverjustsell.com/auth/complete",
  "https://neverjustsell.com/",
  "https://neverjustsell.com/auth/complete",
  "https://classroom.neverjustsell.com/classroom",
  "https://classroom.neverjustsell.com/migration-health",
  "https://classroom.neverjustsell.com/site-login?return_to=https%3A%2F%2Fwww.neverjustsell.com%2Fauth%2Fcomplete",
  "https://community.neverjustsell.com/",
  "https://community.neverjustsell.com/auth/bridge-health",
  "https://www.neverjustsell.com/login"
]) await probe(url);
