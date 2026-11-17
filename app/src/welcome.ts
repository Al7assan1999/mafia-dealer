/* ---------- the welcome (v2.14): a shadow-theatre story before Home, every start (Settings can switch it off) ----------
 * A quiet town, a sound at night, someone dead, then the Doctor, the Detective and the Mafia, then the title.
 * Vector only (no images, no sound). Tap = next scene, Skip or Back = Home. #welcome sits outside #app, above everything. */
const WTXT={
 en:{cap1:'A quiet town. Everyone knows everyone.',cap2:'Then one night… something sounded wrong.',bang:'CRACK!',cap3:'Someone is dead.',
     doc:'The Doctor',docL:'It could happen to anyone. I’ll keep you safe tonight.',det:'The Detective',detL:'I swear I’ll find them.',
     maf:'The Mafia',mafL:'You… I’ll get you all.',ha:['HA','HA','HA'],tag:'Who can you trust?',go:'Tap to start',skip:'Skip',hint:'Tap to move on'},
 ar:{cap1:'بلدة هادئة. الجميع يعرف الجميع.',cap2:'ثم في إحدى الليالي… سُمع صوت غريب.',bang:'طَخ!',cap3:'أحدهم مات.',
     doc:'الطبيب',docL:'قد يحدث هذا لأيٍّ منا. سأحميكم الليلة.',det:'المحقق',detL:'أقسم أنني سأجدهم.',
     maf:'المافيا',mafL:'أنتم… سأنال منكم جميعًا.',ha:['ها','ها','ها'],tag:'بمن تثق؟',go:'اضغط للبدء',skip:'تخطَّ',hint:'اضغط للمتابعة'}};
const WSC: [string,number][]=[['s1',3600],['s2',4000],['s3',3400],['s4',3400],['s5',3000],['s6',3800],['end',2800]];  // scene, how long it stays (ms)
const WL={on:false,idx:-1,timer:0 as any,typeT:0 as any,after:null as (()=>void)|null};
/* the drawings */
const wPerson=(x: number,y: number,s: number,extra='',cls='f')=>`<g class="${cls}" transform="translate(${x} ${y}) scale(${s})" style="stroke:var(--wrim);stroke-width:${(1.4/s).toFixed(2)}"><circle cx="0" cy="-74" r="11"/>
  <path d="M-15 -58 Q0 -66 15 -58 L18 -22 L11 -22 L9 0 L2 0 L0 -20 L-2 0 L-9 0 L-11 -22 L-18 -22 Z"/>${extra}</g>`;
const wHat='<path d="M-20 -80 h40 v3 h-40 z"/><path d="M-11 -80 l2 -14 h18 l2 14 z"/>';
const wIcon=(k: string)=>IC[k].replace(/^<svg[^>]*>|<\/svg>$/g,'');  // the app's own role icons
const wBadge=(k: string)=>`<circle cx="0" cy="-44" r="10" style="fill:var(--w${k})"/><svg x="-7" y="-51" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06050b" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${wIcon(k==='doc'?'doctor':k==='det'?'detective':'mafia')}</svg>`;
function wHouses(){let h='',x=-10,i=0;const rnd=(n: number)=>((Math.sin(n*12.9898)*43758.5453)%1+1)%1;
  while(x<370){const w=44+rnd(i)*34,ht=70+rnd(i+7)*70,y=560-ht;
    h+=`<rect x="${x}" y="${y}" width="${w}" height="${ht}"/><path d="M${x-4} ${y} L${x+w/2} ${y-26-rnd(i+3)*16} L${x+w+4} ${y} Z"/>`;
    for(let r=0;r<2;r++)for(let c=0;c<2;c++)if(rnd(i*4+r*2+c)>.3)h+=`<rect class="win" style="--d:${(rnd(i+r+c)*1.6).toFixed(2)}s" x="${x+8+c*(w/2-4)}" y="${y+14+r*28}" width="${w/2-14}" height="14" rx="2"/>`;
    x+=w+2;i++;}return h;}
function wStars(){let s='';for(let i=0;i<46;i++){const x=(Math.sin(i*91.7)*.5+.5)*360,y=(Math.sin(i*37.3)*.5+.5)*330;s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i%5?.9:1.6}"/>`;}return s;}
function wBuild(el: HTMLElement){const T=WTXT[S.lang==='ar'?'ar':'en'];
  const crowd=[[70,600,.9],[118,612,1],[242,612,1],[290,600,.9],[42,622,.8],[318,622,.8],[180,640,1.05]].map(([x,y,s])=>wPerson(x,y,s)).join('');
  const sky=(id: string,a: string,b: string,c?: string)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(${a})"/>${c?`<stop offset=".55" style="stop-color:var(${b})"/><stop offset="1" style="stop-color:var(${c})"/>`:`<stop offset="1" style="stop-color:var(${b})"/>`}</linearGradient>`;
  el.innerHTML=`<div class="wl" role="dialog" aria-label="Mafia Dealer"><div class="wl-shake">
  <svg class="wl-svg" viewBox="0 0 360 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
   <defs>${sky('wgDawn','--wdawn1','--wdawn2','--wdawn3')}${sky('wgNight','--wnight1','--wnight2')}${sky('wgMorn','--wmorn1','--wmorn2')}${sky('wgRed','--wred1','--wred2')}
    <radialGradient id="wgSpot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="wgVign" cx=".5" cy=".62" r=".75"><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
    <radialGradient id="wgLens" cx=".5" cy=".5" r=".5"><stop offset="0" style="stop-color:var(--wdet)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--wdet)" stop-opacity="0"/></radialGradient>
    <filter id="wgGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
   <rect width="360" height="700" style="fill:var(--wnight1)"/>
   <rect class="layer sky-dawn" width="360" height="700" fill="url(#wgDawn)"/><rect class="layer sky-night" width="360" height="700" fill="url(#wgNight)"/>
   <rect class="layer sky-morn" width="360" height="700" fill="url(#wgMorn)"/><rect class="layer sky-red" width="360" height="700" fill="url(#wgRed)"/>
   <g class="layer stars" style="fill:var(--wstar)">${wStars()}</g>
   <circle class="sun" cx="180" cy="420" r="58" fill="#ffd08a" opacity=".9"/>
   <g class="moon"><circle cx="268" cy="150" r="30" fill="#f4eedd"/><circle cx="280" cy="142" r="27" style="fill:var(--wnight1)" opacity=".55"/></g>
   <g style="fill:var(--wink2)" opacity=".6"><path d="M0 520 h30 v-60 h22 v40 h18 v-80 h26 v90 h30 v-50 h24 v70 h28 v-110 h20 v100 h34 v-40 h28 v60 h26 v-70 h30 v90 h24 V640 H0 Z"/></g>
   <g style="fill:var(--wink2)">${wHouses()}<rect y="558" width="360" height="142"/></g>
   <circle class="ring r1" cx="250" cy="470" r="4"/><circle class="ring r2" cx="250" cy="470" r="4"/><circle class="ring r3" cx="250" cy="470" r="4"/>
   <g class="layer walkers" style="fill:var(--wink)">
     <g class="w1"><g class="bob">${wPerson(0,610,.95,'<path class="wave" d="M8 -54 l14 -18" style="stroke:var(--wink)" stroke-width="6" stroke-linecap="round"/>','')}</g></g>
     <g class="w2"><g class="bob">${wPerson(0,616,.85,'','')}</g></g></g>
   <ellipse class="layer spot" cx="180" cy="610" rx="120" ry="34" fill="url(#wgSpot)"/>
   <g class="layer chalk"><path d="M128 612 q-6 -10 6 -14 l28 -2 q6 -14 18 -10 q12 4 6 16 l34 4 q10 4 0 10 l-26 2 l10 14 q2 8 -8 6 l-18 -12 l-12 14 q-8 4 -8 -6 l6 -14 l-30 4 q-10 -2 -6 -8 z"/></g>
   <g class="layer crowd" style="fill:var(--wink)">${crowd}</g>
   <rect class="layer vign" width="360" height="700" fill="url(#wgVign)"/>
   <g class="hero doc"><circle class="pulse" cx="180" cy="540" r="30" style="stroke:var(--wdoc)"/>
     <g class="rise"><g filter="url(#wgGlow)" style="fill:var(--wdoc)" opacity=".75">${wPerson(180,646,2.05,'','')}</g><g style="fill:var(--wink)">${wPerson(180,646,2,wBadge('doc'),'')}</g></g></g>
   <g class="hero det"><circle class="lens" cx="180" cy="600" r="70" fill="url(#wgLens)"/>
     <g class="rise"><g filter="url(#wgGlow)" style="fill:var(--wdet)" opacity=".7">${wPerson(180,646,2.05,wHat,'')}</g><g style="fill:var(--wink)">${wPerson(180,646,2,wHat+wBadge('det')+'<g transform="translate(16 -40)"><circle cx="10" cy="-10" r="9" fill="none" style="stroke:var(--wink)" stroke-width="4"/><path d="M4 -4 L-6 8" style="stroke:var(--wink)" stroke-width="5" stroke-linecap="round"/></g>','')}</g></g></g>
   <g class="hero maf"><g class="rise" style="transform-origin:180px 646px"><g filter="url(#wgGlow)" style="fill:var(--wmaf)" opacity=".8">${wPerson(180,646,2.12,wHat,'')}</g>
     <g style="fill:var(--wink)">${wPerson(180,646,2.1,wHat+wBadge('maf'),'')}</g>
     <g class="eyes" filter="url(#wgGlow)"><circle cx="171" cy="490" r="4"/><circle cx="189" cy="490" r="4"/></g><g class="eyes"><circle cx="171" cy="490" r="2.4"/><circle cx="189" cy="490" r="2.4"/></g></g></g>
  </svg></div>
  <div class="wl-flash"></div><div class="wl-cap" id="wlCap"></div><div class="wl-bang">${T.bang}</div>
  <div class="wl-say" id="wlSay"><div class="wl-who"></div><div class="wl-bub"></div></div>
  <div class="wl-ha" id="wlHa">${T.ha.map(h=>`<span>${h}</span>`).join('')}</div>
  <div class="wl-title"><div class="wl-mark">${IC.logo}</div><h1>Mafia Dealer</h1><p>${T.tag}</p><div class="wl-go">${T.go}</div></div>
  <div class="wl-hint">${T.hint}</div><div class="wl-prog">${WSC.slice(0,-1).map(()=>'<i><b></b></i>').join('')}</div>
  <button class="wl-skip" type="button" onclick="event.stopPropagation();welcomeEnd()">${T.skip}</button></div>`;
  (el.firstElementChild as HTMLElement).onclick=()=>{if(WL.idx<WSC.length-1)wGo(WL.idx+1);else welcomeEnd();};}
function wType(el: Element,txt: string){clearInterval(WL.typeT);el.textContent='';let i=0;WL.typeT=setInterval(()=>{el.textContent=txt.slice(0,++i);if(i>=txt.length)clearInterval(WL.typeT);},32);}
function wGo(n: number){clearTimeout(WL.timer);WL.idx=n;const [k,ms]=WSC[n],T=WTXT[S.lang==='ar'?'ar':'en'],wl=document.querySelector('#welcome .wl');if(!wl)return;
  wl.className='wl '+k;
  const cap=$('wlCap'),say=$('wlSay'),ha=$('wlHa'),capTxt={s1:T.cap1,s2:T.cap2,s3:T.cap3}[k];
  cap.classList.remove('on');setTimeout(()=>{if(capTxt&&WL.idx===n){cap.textContent=capTxt;cap.classList.add('on');}},k==='s1'?400:250);
  const role={s4:['doc',T.doc,T.docL],s5:['det',T.det,T.detL],s6:['maf',T.maf,T.mafL]}[k];
  say.classList.remove('on');clearInterval(WL.typeT);
  if(role)setTimeout(()=>{if(WL.idx!==n)return;say.style.setProperty('--c',`var(--w${role[0]})`);say.querySelector('.wl-who').textContent=role[1];say.classList.add('on');wType(say.querySelector('.wl-bub'),role[2]);},500);
  ha.classList.remove('on');if(k==='s6')setTimeout(()=>{if(WL.idx===n)ha.classList.add('on');},1700);
  document.querySelectorAll('#welcome .wl-prog i').forEach((p: HTMLElement,i)=>{p.className=i<n?'done':i===n?'now':'';p.style.setProperty('--t',ms+'ms');});
  WL.timer=setTimeout(()=>{if(n<WSC.length-1)wGo(n+1);else welcomeEnd();},ms);}
/** Plays the welcome; then Home (or what was waiting for it: What's new after an update). */
function showWelcome(){const el=$('welcome');if(!el||WL.on)return;WL.on=true;WL.idx=-1;
  try{history.pushState({v:1},'');}catch(e){}  // phone Back skips it
  wBuild(el);void el.offsetWidth;setTimeout(()=>{if(WL.on&&WL.idx<0)wGo(0);},30);}  // the first state is laid out, then scene 1 transitions in
function welcomeEnd(){if(!WL.on)return;WL.on=false;clearTimeout(WL.timer);clearInterval(WL.typeT);
  const el=$('welcome'),wl=el&&el.querySelector('.wl');if(wl)wl.classList.add('out');setTimeout(()=>{if(!WL.on&&el)el.innerHTML='';},500);
  const f=WL.after;WL.after=null;if(f)setTimeout(f,300);}
