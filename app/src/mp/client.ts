/* client */
async function probe(ip,ms){const c=new AbortController(),tm=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch('http://'+ip+':'+PORT+'/s?room',{signal:c.signal,cache:'no-store'});const tx=await r.text();return tx||null;}catch(e){return null;}finally{clearTimeout(tm);}}
async function findHost(tok: number,want?: string): Promise<any>{const my=parseIp(Net.ip()),ok=n=>n&&(!want||n===want);
  if(S.mpLastHost){const n=await probe(S.mpLastHost,1500);if(ok(n))return{ip:S.mpLastHost,name:n};}
  if(tok!==MP.scanTok)return null;
  if(!my.ip&&!my.gw)return{err:'nowifi'};
  const c=[];if(my.gw)c.push(my.gw);
  if(my.ip){const pre=my.ip.split('.').slice(0,3).join('.');for(let i=1;i<255;i++){const x=pre+'.'+i;if(x!==my.ip&&x!==my.gw)c.push(x);}}
  for(let i=0;i<c.length;i+=64){if(tok!==MP.scanTok)return null;MP.pct=Math.round(i/c.length*100);const e=$('pct');if(e)e.textContent=t('searchPct',{n:MP.pct});
    const res=await Promise.all(c.slice(i,i+64).map(ip=>probe(ip,1800).then(n=>ok(n)?{ip,name:n}:null)));const f=res.find(Boolean);if(f)return f;}
  return{err:'notfound'};}
async function joinStart(manual?: string){if(needName())return;SND.unlock();S.mpName=S.mpName.trim();save();
  clientStop(false);chReset();MP.role='client';MP.lastMode='wifi';MP.joinedAt=Date.now();MP.id=myId();MP.room=null;MP.host=null;MP.status='search';MP.pct=0;const tok=++MP.scanTok;
  if(V!=='join')nav('join');else render();
  let r;
  if(manual){const ip=manual.trim();const n=await probe(ip,2500);r=n?{ip,name:n}:{err:'notfound'};}else r=await findHost(tok);
  if(tok!==MP.scanTok||MP.role!=='client')return;
  if(!r||r.err){MP.status=r?r.err:'notfound';render();return;}
  MP.host=r;S.mpLastHost=r.ip;save();lsSet(JNK,{host:r});MP.status='joining';hello();
  MP.hb=0;MP.lastOk=Date.now();clearInterval(MP.timer);MP.timer=setInterval(clientTick,700);render();}
function joinOnline(code){code=String(code||'').replace(/\D/g,'');if(code.length!==6){toast(t('enterCode'));return;}if(needName(true))return;SND.unlock();S.mpName=S.mpName.trim();save();
  clientStop(false);chReset();MP.role='client';MP.lastMode='online';MP.joinedAt=Date.now();MP.id=myId();MP.room=null;MP.host={name:'',ip:''};MP.online={code};MP.status='joining';MP.last=null;MP.roomName=null;MP.hostOn=0;MP.everOk=false;
  if(V!=='join')nav('join');else render();
  clientWs();lsSet(JNK,{online:{code}});MP.hb=0;MP.lastOk=Date.now();clearInterval(MP.timer);MP.timer=setInterval(clientTick,700);}
function clientWs(){const o=MP.online;if(!o||MP.role!=='client')return;MP.wsAt=Date.now();const ws=MP.ws=new WebSocket(relayUrl()+'/r/'+o.code+'?role=p&id='+MP.id+(S.acct?'&tok='+S.acct.tok:''));
  ws.onopen=()=>hello();
  ws.onmessage=e=>{MP.wsAt=Date.now();if(e.data==='pong')return;let m;try{m=JSON.parse(e.data);}catch(x){return;}
    if(m.k==='room'){MP.roomName=m.v;MP.host.name=m.v;}else if(m.k)MP.last=m.v;
    if(m.host!=null)MP.hostOn=m.host;
    if(m.c)chRecv(m.c.ch);  // room chat, live from the host
    if(m.bc&&m.bc.narr&&NARR[m.bc.narr])try{NARR[m.bc.narr](...(m.bc.a||[]));}catch(x){}};
  ws.onclose=()=>{if(MP.ws===ws&&MP.role==='client'&&MP.online)setTimeout(()=>{if(MP.ws===ws)clientWs();},1500);};}
async function cGet(){
  if(MP.online){const w=MP.ws;if(w&&w.readyState===1&&MP.hb%3===0)w.send('ping');
    if(w&&Date.now()-MP.wsAt>7000){MP.ws=null;try{w.close();}catch(e){}clientWs();throw 0;}  // silent dead link (Wi-Fi gone): reconnect
    if(!w||w.readyState!==1||Date.now()-MP.wsAt>4500||(!MP.hostOn&&MP.roomName!==''))throw 0;return MP.last||'';}
  const c=new AbortController(),tm=setTimeout(()=>c.abort(),2500);
  try{const r=await fetch('http://'+MP.host.ip+':'+PORT+'/s?p_'+MP.id,{signal:c.signal,cache:'no-store'});return await r.text();}finally{clearTimeout(tm);}}
function send(o){if(MP.online){o.id=MP.id;try{if(MP.ws&&MP.ws.readyState===1)MP.ws.send(encodeURIComponent(JSON.stringify(o)));}catch(e){}return;}
  if(!MP.host)return;o.id=MP.id;fetch('http://'+MP.host.ip+':'+PORT+'/a?'+encodeURIComponent(JSON.stringify(o)),{cache:'no-store'}).catch(()=>{});}
function hello(){MP.helloAt=Date.now();(MP.hellos=MP.hellos||[]).push(MP.helloAt);MP.hellos=MP.hellos.slice(-6);const u=me();send(Object.assign({t:'hello',h:MP.helloAt,name:S.mpName,v:APP.code},u?{uid:u.id,uav:u.avatar}:{}));}
async function clientTick(){if(MP.busy||MP.role!=='client')return;MP.busy=true;const t0=Date.now();
  try{const tx=await cGet();
    MP.lat=Date.now()-t0;MP.lastOk=Date.now();
    if(!tx){const n=MP.online?MP.roomName:await probe(MP.host.ip,1500);
      if(!n&&!(MP.online&&MP.roomName==null)){MP.status=MP.online&&!MP.everOk?'noroom':'closed';lsSet(JNK,null);}else{MP.status='joining';if(Date.now()-MP.helloAt>2000)hello();}}
    else{const st=JSON.parse(tx);
      if(st.err==='kicked'&&st.kicked>(MP.joinedAt||0)){MP.status='kicked';clientStop(false);lsSet(JNK,null);}
      else if(st.err&&!(MP.hellos||[]).includes(st.h)){MP.status='joining';if(Date.now()-MP.helloAt>2000)hello();}  // an old rejection still stored on the relay: ask again
      else if(st.err){MP.status=st.err==='name'?'taken':st.err==='started'?'started':st.err==='kicked'?'kicked':'full';clientStop(false);lsSet(JNK,null);}
      else{const ping=MP.room&&st.seq>MP.room.seq;MP.room=st;MP.status='ok';MP.everOk=true;chRecv(st.ch,st.mc);if(ping){buzzFx();toast(t('pingedYou'));}
        if(st.g&&!st.g.ph&&MP.readyDeal===st.g.deal&&!st.g.meReady&&MP.hb%2===0)send({t:'ready',deal:st.g.deal});
        const g=st.g;if(g&&MP.sent&&MP.hb%2===0){if(g.ph==='night'&&MP.sent.k===nkeyN(g))send({t:'act',n:g.n,deal:g.deal,sel:MP.sent.sel});if(g.ph==='vote'&&MP.sent.k==='v'+g.v)send({t:'vote',v:g.v,sel:MP.sent.sel});}}}}
  catch(e){const gone=Date.now()-MP.lastOk;if(gone>4000)MP.status='lost';if(gone>8000&&!MP.online)rescan();}
  MP.busy=false;if(MP.status==='ok')chResend();if(MP.role==='client'&&++MP.hb%3===0)send({t:'hb'});
  if(V==='join'){const sig=joinSig();if(sig!==MP.sig)render();else{const e=$('lat');if(e&&!MP.online)e.textContent=t('lat',{n:MP.lat});}}}
function clientStop(bye){if(bye)chReset();clearInterval(MP.timer);MP.timer=null;MP.scanTok++;if(bye&&MP.role==='client'&&MP.host)send({t:'bye'});if(MP.ws){const w=MP.ws;MP.ws=null;setTimeout(()=>{try{w.close();}catch(e){}},300);}if(bye){MP.role=null;MP.online=null;lsSet(JNK,null);}}
async function rescan(){if(MP.rescan||Date.now()-(MP.rescanAt||0)<3000)return;MP.rescan=true;const tok=MP.scanTok,want=MP.host.name;
  const r=await findHost(tok,want);MP.rescan=false;MP.rescanAt=Date.now();
  if(tok===MP.scanTok&&MP.role==='client'&&r&&r.ip&&r.ip!==MP.host.ip){MP.host=r;S.mpLastHost=r.ip;save();lsSet(JNK,{host:r});hello();}}
const nkeyN=g=>'n'+g.deal+'.'+g.n;  // a night choice belongs to this deal and this night only
function joinSig(){const r=MP.room,g=r&&r.g;if(g&&g.ph)return MP.status+'|'+JSON.stringify(g)+'|'+(MP.sent?MP.sent.k:'');if(g&&MP.readyDeal!==g.deal)return MP.status+'|card|'+g.deal+g.role;
  return MP.status+JSON.stringify(r&&r.players)+(r&&r.mu?'|mu':'')+(g?'|'+g.deal+'|'+g.readyN+'|'+g.meReady:'');}
function cpick(j){MP.sel=j;render();}
function ptimerHtml(g){setTimeout(ptick,0);return `<div class="ptimer"><span class="lbl">${t(g.ph==='night'||g.ph==='nightDone'?'r_nightT':'r_timer')}</span><b id="ptt">${fmt(tmLeft(g.tm))}</b></div>`;}
const tmLeft=tm=>tm.end?Math.max(0,Math.round((tm.end-Date.now())/1000)):tm.left;
let ptickTimer: any;
function ptick(){clearInterval(ptickTimer);ptickTimer=setInterval(()=>{const e=$('ptt'),g=MP.room&&MP.room.g;if(!e||!g||!g.tm){clearInterval(ptickTimer);return;}const l=tmLeft(g.tm);e.textContent=fmt(l);e.classList.toggle('low',l<=10);},500);}
function cconfirm(){const g=MP.room&&MP.room.g;if(!g)return;
  if(g.ph==='night'){MP.sent={k:nkeyN(g),sel:g.key==='none'?null:MP.sel};send({t:'act',n:g.n,deal:g.deal,sel:MP.sent.sel});}
  if(g.ph==='vote'){MP.sent={k:'v'+g.v,sel:MP.sel};send({t:'vote',v:g.v,sel:MP.sel});}
  render();}
const cOpt=o=>`<button class="opt ${MP.sel===o.j?'sel':''}" ${o.dis?'disabled':''} onclick="cpick(${o.j})"><span class="num">${o.j+1}</span><b>${esc(o.name)}</b>${o.tag?`<small class="${o.red?'tag':''}">${esc(o.tag)}</small>`:''}<span class="rad"></span></button>`;
function msgHtml(m){if(!m)return '';const bad=m.k==='killed'||m.k==='out';
  return `<div class="lbl" style="margin-top:6px">${m.k==='killed'?t('victimIs'):m.k==='out'?t('outIs'):m.k==='savedIs'?t('savedIs'):''}</div>
   <div class="victim" style="font-size:30px;color:${bad?'var(--red2)':'var(--green)'}">${m.n?esc(m.n):t(m.k)}</div>${m.r?`<p class="hint" style="margin:0">${t('wasRole',{r:t(m.r)})}</p>`:''}${m.tally?`<p class="tally">${esc(m.tally)}</p>`:''}`;}
const rosterHtml=g=>`<div class="roster" style="justify-content:center;margin-top:14px">${g.roster.map(x=>`<span class="${x.alive?'':'dead'}">${esc(x.name)}</span>`).join('')}</div>`;
const miniRole=g=>`<div class="sec mt"><div class="flbl" style="margin-top:0">${t('roleReminder')}</div><div class="hold" id="hold" style="height:120px;margin:0"><div class="cover">${IC.eye}${t('holdHint')}</div>
  <div class="rv"><div class="rn" style="font-size:26px;color:${RC[g.role]}">${t(g.role)}</div>${g.mates.length?`<div class="mates">${t('mates',{n:g.mates.map(esc).join(S.lang==='ar'?'، ':', ')})}</div>`:''}</div></div></div>`;
const LBL={dawn:'allDone',morning:'morning',day:'discussion',verdict:'deciding',mpNight:'night',mpVote:'ballot'};
function mpClientView(g){const key=g.deal+'|'+g.ph+(g.n||g.v||'');if(MP.selKey!==key){MP.selKey=key;MP.sel=null;}
  if(MP.sentDeal!==g.deal){MP.sentDeal=g.deal;MP.sent=null;}  // a new deal never inherits old choices
  const sent=MP.sent&&MP.sent.k===(g.ph==='night'?nkeyN(g):g.ph==='vote'?'v'+g.v:'x');
  if(g.ph==='night'&&!sent){let rows=g.opts.map(cOpt).join('');
    if(g.skip)rows+=`<button class="opt skip ${MP.sel==='skip'?'sel':''}" onclick="cpick('skip')"><b>${t('skipKill')}<br><span class="skipleft">${t('skipLeft')}${g.skip.mv?' · '+t('mateVote'):''}</span></b><span class="rad"></span></button>`;
    return `<div class="act"><div class="ah"><span>${esc(S.mpName)}</span><span>${t('night')} ${g.n}</span></div><h2>${t('a_'+g.key)}</h2><p class="d">${t('a_'+g.key+'_d')}</p>
     ${rows?`<div class="list">${rows}</div>`:''}<button class="btn primary" ${g.key!=='none'&&MP.sel===null?'disabled':''} onclick="cconfirm()">${IC.lock.replace('<svg','<svg style="width:20px;height:20px"')}${t('confirm')}</button></div>`;}
  if(g.ph==='vote'&&!sent){let rows=`<button class="opt skip ${MP.sel==='none'?'sel':''}" onclick="cpick('none')"><b>${t('noOne')}</b><span class="rad"></span></button>`+g.opts.map(cOpt).join('');
    return `<div class="act"><div class="ah"><span>${esc(S.mpName)}</span><span>${t(g.open?'tableVote':'ballot')}</span></div><h2>${t('votePick')}</h2><div style="height:8px"></div><div class="list">${rows}</div>
     <button class="btn primary" ${MP.sel===null?'disabled':''} onclick="cconfirm()">${t('castVote')}</button></div>${boardHtml(g.board)}`;}
  if(g.ph==='night'||g.ph==='nightDone'){let body=`<div class="orb">${IC.lock}</div><div class="res">${t('locked')}</div>`;
    if(g.check)body=`<div class="orb" style="color:${g.check.m?'var(--red2)':'var(--green)'}">${IC.detective}</div><div class="res" style="color:${g.check.m?'var(--red2)':'var(--green)'}">${t(g.check.m?'isMafia':'notMafia',{n:esc(g.check.n)})}</div>`;
    return `<div class="big">${body}<p class="hint" style="margin:0">${g.ph==='nightDone'?t('waitOthersN',{n:t('doneN',{n:g.doneN,m:g.total})}):t('sending')}</p></div>`;}
  if(g.ph==='vote'||g.ph==='voted')return `<div class="big"><div class="orb">${IC.lock}</div><div class="res">${t('voted')}</div><p class="hint" style="margin:0">${g.ph==='voted'?t('waitOthersN',{n:t('votedN',{n:g.doneN,m:g.total})}):t('sending')}</p></div>${boardHtml(g.board)}`;
  if(g.ph==='end')return (g.recap?recapCard(g.recap):'')+`<button class="btn primary mt" onclick="MP.endHide=${g.deal};render()">${t('toLobby')}</button><p class="mpinfo" style="text-align:center;margin-top:8px">${t('toLobbyD')}</p>`;
  const dead=g.ph==='dead';
  return `<div class="big"><div class="chip">${t(LBL[g.label]||(MP.online?'listenNarr':'lookHost'))}${g.label==='morning'||g.label==='day'?' '+g.day:''}</div>
   ${g.check?`<div class="sec" style="margin-bottom:12px;border-color:${g.check.m?'var(--red2)':'var(--green)'}"><div class="flbl" style="margin-top:0">${t('detective')}</div><b style="font-size:17px;color:${g.check.m?'var(--red2)':'var(--green)'}">${t(g.check.m?'isMafia':'notMafia',{n:esc(g.check.n)})}</b></div>`:''}
   ${dead?`<div class="orb">${IC.skull}</div><p class="hint">${t('youOut')}</p>`:''}${dead&&g.roles?`<div class="sec ghost"><div class="sh"><h3>${IC.eye}${t('r_ghost')}</h3></div>${g.roster.map((x,j)=>`<div class="endrow">${x.alive?`<span>${esc(x.name)}</span>`:`<s>${esc(x.name)}</s>`}<b style="color:${RC[g.roles[j]]}">${t(g.roles[j])}</b></div>`).join('')}</div>`:''}${msgHtml(g.msg)||(dead?'':`<div class="orb">${IC.phone}</div><div class="res" style="font-size:20px">${t(MP.online?'listenNarr':'lookHost')}</div>`)}${rosterHtml(g)}</div>${dead?'':miniRole(g)}`;}
function clientReady(){const g=MP.room&&MP.room.g;if(!g)return;MP.readyDeal=g.deal;send({t:'ready',deal:g.deal});render();}
function joinView(){const st=MP.status;MP.sig=joinSig();let b='';
  const manual=MP.online?'':`<div class="sec mt"><div class="flbl" style="margin-top:0">${t('manual')}</div><div class="prow" style="margin:0"><input id="mip" inputmode="decimal" placeholder="192.168.1.5" value="${esc(S.mpLastHost||'')}" style="direction:ltr"><button class="pill" onclick="joinStart($('mip').value)">${t('connect')}</button></div></div>`;
  if(st==='search')b=`<div class="big"><div class="spin"></div><div class="res" style="font-size:20px">${t('searching')}</div><p class="hint" id="pct" style="margin:0">${t('searchPct',{n:MP.pct})}</p></div>${manual}`;
  else if(st==='nowifi'||st==='notfound')b=`<div class="big"><div class="orb">${IC.phone}</div><p class="hint">${t(st==='nowifi'?'noWifi':'notFound')}</p><button class="btn primary" onclick="joinStart()">${t('tryAgain')}</button></div>${manual}`;
  else if(st==='started')b=`<div class="big"><div class="orb">${IC.lock}</div><p class="hint">${t('started')}</p><button class="btn primary" onclick="joinStart()">${t('tryAgain')}</button></div>`;
  else if(st==='ok'&&MP.room&&MP.room.g&&MP.room.g.ph&&!(MP.room.g.ph==='end'&&MP.endHide===MP.room.g.deal)){const g=MP.room.g;b=(g.tm&&g.ph!=='dead'&&g.ph!=='end'?ptimerHtml(g):'')+mpClientView(g);}
  else if(st==='ok'&&MP.room&&MP.room.g&&MP.readyDeal!==MP.room.g.deal){const g=MP.room.g;b=roleCard(S.mpName,g.role,g.mates,'clientReady()');}
  else if(st==='taken'||st==='full')b=`<div class="big"><div class="orb">${IC.lock}</div><p class="hint">${t(st==='taken'?'nameTaken':'full')}</p><button class="btn primary" onclick="clientStop(true);back()">${t('changeName')}</button></div>`;
  else if(st==='kicked')b=`<div class="big"><div class="orb">${IC.lock}</div><p class="hint">${t('kickedYou')}</p><button class="btn primary" onclick="clientStop(true);back()">${t('ok')}</button></div>`;
  else if(st==='noroom')b=`<div class="big"><div class="orb">${IC.lock}</div><p class="hint">${t('badCode')}</p><button class="btn primary" onclick="back()">${t('tryAgain')}</button></div>`;
  else if(st==='closed')b=`<div class="big"><div class="orb">${IC.lock}</div><p class="hint">${t('closed')}</p><button class="btn primary" onclick="joinStart()">${t('tryAgain')}</button></div>`;
  else{const h=MP.host?esc(MP.host.name):'';
    b=`<div class="big"><div class="chip">${st==='ok'?t('connected',{n:h}):st==='lost'?t('lost'):t('joining',{n:h})}</div><div class="who" style="font-size:28px">${esc(S.mpName)}</div>
     <p class="hint" id="lat" style="margin:0">${st==='ok'&&!MP.online?t('lat',{n:MP.lat}):''}</p></div>
     ${MP.room?`<div class="sec mt"><div class="sh"><h3>${t('playersIn',{n:MP.room.players.length})}</h3></div>${roomList(MP.room.players)}</div>`:''}
     ${st==='ok'&&MP.room&&MP.room.g&&!MP.room.g.ph?`<div class="big mt"><div class="res" style="font-size:20px">${t('youReady')}</div><p class="hint" style="margin:0">${t('waitOthers')} ${t('readyN',{n:MP.room.g.readyN,m:MP.room.g.total})}</p></div>`
       :st==='ok'?`<p class="mpinfo" style="text-align:center;margin:4px 0 12px">${t('waitDeal')}</p>${MP.room.mu?`<p class="hint" style="text-align:center">${t('buzzMuted')}</p>`:`<button class="btn primary" onclick="send({t:'buzz'});toast(t('buzzSent'))">${t('buzzHost')}</button>`}${copyRow()}<button class="btn ghost mt" onclick="shareRoom()">${IC.share}${t(MP.online?'shareCode':'shareAddr')}</button>${MP.online&&me()?`<button class="btn ghost mt" onclick="dockOpen(true)">${IC.friend}${t('fInviteT')}</button>`:''}${rulesChips(MP.room.rules)}`:''}`;}
  return head(joinTitle())+(MP.room&&MP.room.hv>APP.code?`<div class="banner"><div>${t('hostNewer')}</div></div>`:'')+b+`<button class="danger" onclick="leaveAsk()">${t('leave')}</button>`;}
function joinTitle(){const g=MP.room&&MP.room.g,h=MP.host&&MP.host.name;
  if(g&&g.ph){if(g.ph==='night'||g.ph==='nightDone')return t('night')+' '+g.n;if(g.ph==='vote'||g.ph==='voted')return t(g.open?'tableVote':'ballot');if(g.ph==='end')return t('gameOver');
    if(g.ph==='dead')return t('outT');return t(LBL[g.label]||'roomOf',{n:esc(h||'')})+(g.label==='morning'||g.label==='day'?' '+g.day:'');}
  return h?t('roomOf',{n:esc(h)}):t('join');}
function leaveAsk(){askLeaveRoom();}
