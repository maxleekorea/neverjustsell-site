import json, os, time, re
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException

# Research-only benchmark targets; no production routes are changed.\nTARGETS = [
    ("njs", "https://www.neverjustsell.com/"),
    ("thefutur", "https://thefutur.com/"),
    ("reforge", "https://www.reforge.com/"),
    ("strategyzer", "https://www.strategyzer.com/"),
    ("longblack", "https://longblack.co/about"),
    ("publy", "https://publy.co/"),
]
VIEWPORTS = [("desktop", 1440, 900), ("mobile", 390, 844)]
OUT = Path("benchmark-output")
OUT.mkdir(exist_ok=True)

JS = r"""
const vpH = window.innerHeight, vpW = window.innerWidth;
const visible = (el) => {
  if (!el) return false;
  const s = getComputedStyle(el);
  if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vpH && r.right > 0 && r.left < vpW;
};
const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {x:+r.x.toFixed(1), y:+r.y.toFixed(1), width:+r.width.toFixed(1), height:+r.height.toFixed(1), bottom:+r.bottom.toFixed(1)};
};
const style = (el) => {
  if (!el) return null;
  const s = getComputedStyle(el);
  return {
    fontSize:s.fontSize, lineHeight:s.lineHeight, fontFamily:s.fontFamily,
    fontWeight:s.fontWeight, letterSpacing:s.letterSpacing, color:s.color,
    maxWidth:s.maxWidth, textAlign:s.textAlign
  };
};
const h1 = [...document.querySelectorAll('h1')].find(visible) || document.querySelector('h1');
const header = [...document.querySelectorAll('header')].find(visible) || document.querySelector('header');
let hero = null;
if (h1) {
  hero = h1.closest('section');
  if (!hero) {
    let p = h1.parentElement;
    for (let i=0; p && i<5; i++, p=p.parentElement) {
      const r=p.getBoundingClientRect();
      if (r.width > vpW*0.75 && r.height > h1.getBoundingClientRect().height*1.5) { hero=p; break; }
    }
  }
}
const paras = h1 ? [...(hero || h1.parentElement).querySelectorAll('p')].filter(visible) : [...document.querySelectorAll('p')].filter(visible);
const lead = paras.find(p => p.textContent.trim().length >= 25) || paras[0] || null;
const heroLinks = hero ? [...hero.querySelectorAll('a,button')].filter(visible) : [];
let nextTop = null;
if (hero && hero.nextElementSibling) nextTop = hero.nextElementSibling.getBoundingClientRect().top;

const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let chars=0, blocks=0, seen=new Set(), n;
while(n=walker.nextNode()){
  const text=(n.nodeValue||'').replace(/\s+/g,' ').trim();
  if(!text) continue;
  const el=n.parentElement;
  if(!el || !visible(el)) continue;
  const r=el.getBoundingClientRect();
  if(r.top >= vpH || r.bottom <= 0) continue;
  chars += text.length;
  if(text.length >= 12 && !seen.has(el)){ seen.add(el); blocks++; }
}
const bodyStyle = style(document.body);
return {
  url: location.href,
  title: document.title,
  viewport:{width:vpW,height:vpH},
  h1Text:h1? h1.innerText.trim():null,
  h1Rect:rect(h1), h1Style:style(h1),
  leadText:lead? lead.innerText.trim():null,
  leadRect:rect(lead), leadStyle:style(lead),
  headerRect:rect(header),
  heroRect:rect(hero),
  nextSectionTop: nextTop===null?null:+nextTop.toFixed(1),
  visibleCharsFirstViewport:chars,
  visibleTextBlocksFirstViewport:blocks,
  visibleHeroActions:heroLinks.slice(0,8).map(el=>({text:el.innerText.trim(),rect:rect(el)})),
  bodyStyle
};
"""

def clean_name(s):
    return re.sub(r"[^a-z0-9_-]+","-",s.lower()).strip("-")

rows=[]
for name,url in TARGETS:
    for vp_name,w,h in VIEWPORTS:
        opts=Options()
        opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--hide-scrollbars")
        opts.add_argument("--lang=ko-KR")
        opts.add_argument(f"--window-size={w},{h}")
        opts.add_argument("--force-device-scale-factor=1")
        driver=None
        rec={"site":name,"requestedUrl":url,"viewportName":vp_name,"viewportWidth":w,"viewportHeight":h}
        try:
            driver=webdriver.Chrome(options=opts)
            driver.set_page_load_timeout(35)
            driver.get(url)
            time.sleep(4)
            # Dismiss common cookie overlays when obvious.
            for txt in ["Accept all","Accept All","Agree","동의","모두 동의","확인"]:
                try:
                    els=driver.find_elements("xpath", f"//button[contains(normalize-space(.), '{txt}')]")
                    for el in els[:2]:
                        if el.is_displayed():
                            el.click(); time.sleep(.5); break
                except Exception:
                    pass
            data=driver.execute_script(JS)
            rec.update(data)
            path=OUT/f"{clean_name(name)}-{vp_name}.png"
            driver.save_screenshot(str(path))
            rec["screenshot"]=path.name
        except Exception as e:
            rec["error"]=repr(e)
        finally:
            if driver:
                try: driver.quit()
                except Exception: pass
        rows.append(rec)

(OUT/"metrics.json").write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding="utf-8")

# Compact CSV-like markdown for quick artifact inspection.
cols=["site","viewportName","h1Text","h1Style","h1Rect","leadStyle","leadRect","heroRect","visibleCharsFirstViewport","visibleTextBlocksFirstViewport"]
lines=["|site|viewport|H1 px / line|H1 box|Lead px / line|Hero h|Chars|Blocks|","|---|---:|---|---:|---|---:|---:|---:|"]
for r in rows:
    hs=r.get("h1Style") or {}; hr=r.get("h1Rect") or {}; ls=r.get("leadStyle") or {}; her=r.get("heroRect") or {}
    lines.append(f"|{r['site']}|{r['viewportName']}|{hs.get('fontSize','-')} / {hs.get('lineHeight','-')}|{hr.get('width','-')}×{hr.get('height','-')}|{ls.get('fontSize','-')} / {ls.get('lineHeight','-')}|{her.get('height','-')}|{r.get('visibleCharsFirstViewport','-')}|{r.get('visibleTextBlocksFirstViewport','-')}|")
(OUT/"summary.md").write_text("\n".join(lines),encoding="utf-8")
print("\n".join(lines))
