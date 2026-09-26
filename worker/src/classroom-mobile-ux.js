export function classroomMobileUxScript() {
  return `(function(){
    function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
    ready(function(){
      var top=document.querySelector('.top');
      var desktopNav=top&&top.querySelector(':scope > span');
      if(top&&desktopNav&&!top.querySelector('.mobile-service-nav')){
        var details=document.createElement('details');
        details.className='mobile-service-nav';
        var summary=document.createElement('summary');
        summary.textContent='메뉴';
        var panel=document.createElement('div');
        panel.className='mobile-service-panel';
        Array.from(desktopNav.querySelectorAll('a')).forEach(function(a){panel.appendChild(a.cloneNode(true));});
        details.appendChild(summary);details.appendChild(panel);top.appendChild(details);
      }

      var player=document.querySelector('[data-learning-player]');
      if(!player)return;
      var card=player.closest('.card');
      if(!card)return;
      var video=card.querySelector('.video');
      var curriculum=card.querySelector('.curriculum');
      var nav=card.querySelector('.nav-row');
      if(video&&curriculum&&!card.querySelector('.curriculum-drawer')){
        var drawer=document.createElement('details');
        drawer.className='curriculum-drawer';
        var head=document.createElement('summary');
        head.innerHTML='<span>전체 커리큘럼</span><span class="curriculum-drawer-hint">펼쳐보기</span>';
        curriculum.parentNode.insertBefore(drawer,curriculum);
        drawer.appendChild(head);drawer.appendChild(curriculum);
        if(nav&&nav.parentNode===card){nav.insertAdjacentElement('afterend',drawer);}
        else{video.insertAdjacentElement('afterend',drawer);}
        drawer.addEventListener('toggle',function(){var hint=drawer.querySelector('.curriculum-drawer-hint');if(hint)hint.textContent=drawer.open?'접기':'펼쳐보기';});
      }
      if(video&&nav&&video.parentNode===card&&nav.parentNode===card){video.insertAdjacentElement('afterend',nav);}
    });
  })();`;
}

export function classroomMobileUxMarkup() {
  return `<style>
  .mobile-service-nav{display:none}
  .curriculum-drawer{margin-top:18px;border:1px solid #303030;border-radius:14px;background:#111;overflow:hidden}
  .curriculum-drawer>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;cursor:pointer;font-size:14px;font-weight:700;list-style:none}
  .curriculum-drawer>summary::-webkit-details-marker{display:none}.curriculum-drawer-hint{font-size:12px;color:#888;font-weight:400}
  .curriculum-drawer>.curriculum{margin:0;padding:0 14px 14px;border-top:1px solid #292929}
  @media(max-width:560px){
    .top>span{display:none!important}.mobile-service-nav{display:block;position:relative;margin-left:auto}.mobile-service-nav>summary{list-style:none;border:1px solid #343434;border-radius:999px;padding:8px 12px;color:#ddd;font-size:12px;cursor:pointer}.mobile-service-nav>summary::-webkit-details-marker{display:none}
    .mobile-service-panel{position:absolute;right:0;top:42px;z-index:30;width:min(240px,calc(100vw - 32px));background:#151515;border:1px solid #343434;border-radius:14px;padding:8px;box-shadow:0 14px 35px rgba(0,0,0,.35)}
    .mobile-service-panel a{display:block;padding:11px 12px;border-radius:9px;text-decoration:none;color:#ddd;font-size:14px}.mobile-service-panel a:active{background:#242424}
    [data-learning-player]~*{}.video:has([data-learning-player]){order:4}.nav-row{order:5;margin-top:14px}.curriculum-drawer{order:6}.card:has([data-learning-player]){display:flex;flex-direction:column}.card:has([data-learning-player])>.eyebrow{order:1}.card:has([data-learning-player])>.title{order:2}.card:has([data-learning-player])>.desc,.card:has([data-learning-player])>.note,.card:has([data-learning-player])>.progress,.card:has([data-learning-player])>.progress-label{order:3}.card:has([data-learning-player])>.action{order:7}
    .card:has([data-learning-player]) .video{margin-top:16px}.card:has([data-learning-player]) .nav-row .action,.card:has([data-learning-player]) .nav-row form,.card:has([data-learning-player]) .nav-row button{flex:1;width:auto;margin-top:0}.card:has([data-learning-player]) .nav-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.card:has([data-learning-player]) .nav-row:has(> :only-child){grid-template-columns:1fr}
    .curriculum-drawer .lesson-row{align-items:stretch}.curriculum-drawer .lesson-link{text-align:left}.curriculum-drawer .module-title{margin-top:14px}
  }
  </style><script src="/classroom/mobile-learning.js" defer></script>`;
}

export function injectClassroomMobileUx(response) {
  const type=String(response.headers.get('Content-Type')||'');
  if(response.status!==200||!type.includes('text/html'))return Promise.resolve(response);
  return response.text().then(function(body){
    if(body.includes('/classroom/mobile-learning.js'))return new Response(body,{status:response.status,headers:response.headers});
    const marker='</head>';
    if(!body.includes(marker))return new Response(body,{status:response.status,headers:response.headers});
    const headers=new Headers(response.headers);headers.delete('Content-Length');
    return new Response(body.replace(marker,classroomMobileUxMarkup()+marker),{status:response.status,headers});
  });
}
