/* host */
function hostStart(online){if(needName(online))return;SND.unlock();S.mpName=S.mpName.trim();save();
  MP.role='host';MP.players={};MP.kicked={};MP.seq=0;MP.pubAt=0;MP.game=null;
  MP.online=online?{code:String(100000+Math.floor(Math.random()*900000)),key:rnd(24)}:null;HN=MP.online?onlineNet(MP.online):window.Net;
  hostOpen();hostPublish();nav('host');}
function hostOpen(){lsSet(JNK,null);HN.clear();HN.start(PORT);HN.put('room',S.mpName);MP.myIp=parseIp(HN.ip()).ip;keepOn(true);
  clearInterval(MP.timer);MP.timer=setInterval(hostTick,250);}
function hostResume(){const s=lsGet(MPK);if(!s||needName(!!s.online))return;SND.unlock();
  MP.online=s.online||null;HN=MP.online?onlineNet(MP.online):window.Net;MP.role='host';MP.seq=s.seq||0;MP.pubAt=0;MP.game=s.game;MP.players=s.players||{};
  for(const q of Object.values(MP.players)){q.on=false;q.seen=0;}
  if(s.G){G=s.G;G.hostTurn=false;G.hostRes=false;G.sel=null;}
  hostOpen();hostPublish();nav('host');if(G)enterGame();}
function hostDiscard(){lsSet(MPK,null);render();}
const resumeMpBtn=()=>{const s=lsGet(MPK);return s?`<button class="btn gold" onclick="hostResume()">${t('resumeMp')} <small>· ${s.G?t('round')+' '+s.G.day:t('rolesDealt')}</small></button>
  <button class="link discard" onclick="ask(t('discardQ'),t('discardD'),t('discard'),hostDiscard)">${t('discard')}</button>`:'';};
function hostTick(){let m,ch=false;const now=Date.now();
  while((m=HN.take())!=null){let o;try{o=JSON.parse(decodeURIComponent(m));}catch(e){continue;}if(!o||!o.id)continue;
    const p=MP.players[o.id];
    if(o.t==='hello'){const nm=String(o.uname||o.name||'').trim().slice(0,18);if(p){p.v=o.v||0;p.uid=o.uid||null;p.uav=o.uav||'';}
      const taken=!nm||nkey(nm)===nkey(S.mpName)||Object.entries(MP.players).some(([k,q])=>k!==o.id&&nkey(q.name)===nkey(nm));
      if(taken){HN.put('p_'+o.id,JSON.stringify({err:'name',h:o.h}));continue;}
      if(!p&&MP.game){HN.put('p_'+o.id,JSON.stringify({err:'started',h:o.h}));continue;}
      if(!p&&Object.keys(MP.players).length>=19){HN.put('p_'+o.id,JSON.stringify({err:'full',h:o.h}));continue;}
      if(p&&MP.game){p.seen=now;if(!p.on){p.on=true;ch=true;}continue;}
      MP.players[o.id]={name:nm,seen:now,on:true,v:o.v||0,uid:o.uid||null,uav:o.uav||''};ch=true;}
    else if(p){p.seen=now;if(!p.on){p.on=true;ch=true;}
      if(o.t==='buzz'){p.buzz=(p.buzz||0)+1;const mx=S.host.buzzMax;if(!mx||p.buzz<=mx){buzzFx();toast(t(mx&&p.buzz===mx?'buzzLast':'buzzed',{n:p.name}));}ch=true;}
      if(o.t==='ready'&&MP.game&&o.deal===MP.game.deal&&!MP.game.ready[o.id]){MP.game.ready[o.id]=true;ch=true;}
      if(G&&G.mp){const i=G.ids.indexOf(o.id);
        if(o.t==='act'&&i>=0&&G.phase==='mpNight'&&o.n===G.day&&o.deal===MP.game.deal&&G.alive[i]&&!G.done[i]){const no=nightOpts(i);
          const ok=no.key==='none'?true:o.sel==='skip'?!!no.skip:no.opts.some(x=>x.j===o.sel&&!x.dis);if(ok){mpRecord(i,no.key==='none'?null:o.sel);ch=true;}}
        if(o.t==='vote'&&i>=0&&G.phase==='mpVote'&&o.v===G.voteId&&G.alive[i]&&G.votes[i]===undefined&&(o.sel==='none'||(G.alive[o.sel]&&o.sel!==i))){G.votes[i]=o.sel;ch=true;mpCheckVote();}}
      if(o.t==='bye'){if(MP.game){p.on=false;p.seen=0;}else{delete MP.players[o.id];HN.put('p_'+o.id,'');}ch=true;}}}
  for(const q of Object.values(MP.players)){const on=now-q.seen<6000;if(on!==q.on){q.on=on;ch=true;}}
  if(ch||now-MP.pubAt>1500)hostPublish();
  if(G&&G.mp&&G.phase==='mpNight'&&G.nightEnd){if(now>G.nightEnd){aliveIdx().forEach(i=>{if(!G.done[i]){G.done[i]=true;G.skipped=(G.skipped||0)+1;}});G.hostTurn=false;G.hostRes=false;G.nightEnd=0;hostPublish();mpCheckNight();if(G&&G.phase==='mpNight')render();}
    else{const e=$('mpprog');if(e)e.innerHTML=mpProg();}}
  if(ch&&G&&G.mp&&G.phase==='mpNight')mpCheckNight();
  if(ch&&V==='host'){if(G){if(G.mp&&$('mpprog'))$('mpprog').innerHTML=mpProg();if(G.mp&&G.open&&$('hboard'))$('hboard').innerHTML=boardHtml(voteBoard());}else if(MP.game&&$('rdy'))$('rdy').innerHTML=readyHtml();else render();}}
function hostPublish(){MP.pubAt=Date.now();
  const room={host:S.mpName,hv:APP.code,rules:activeRules(),seq:MP.seq,players:([{name:S.mpName,on:true,host:true,uid:me()&&me().id,av:me()&&me().avatar}] as RoomPlayer[]).concat(Object.values(MP.players).map(q=>({name:q.name,on:q.on,uid:q.uid,av:q.uav})))};
  const g=MP.game;
  for(const id in MP.players){const st: Record<string,any>=Object.assign({you:MP.players[id].name,mu:buzzMuted(MP.players[id])},room);
    if(g&&G&&G.mp){const i=G.ids.indexOf(id);if(i>=0)st.g=mpPriv(i);}
    else if(g){const i=g.ids.indexOf(id);if(i>=0){const r=g.roles[i];
      st.g={deal:g.deal,phase:'deal',role:r,mates:r==='mafia'?g.names.filter((n,j)=>j!==i&&g.roles[j]==='mafia'):[],meReady:!!g.ready[id],readyN:Object.keys(g.ready).length,total:g.ids.length};}}
    HN.put('p_'+id,JSON.stringify(st));}
  mpSnap();}
function hostIds(){return ['host'].concat(Object.keys(MP.players).filter(id=>MP.players[id].on));}
function hostDeal(){const ids=hostIds(),names=ids.map(id=>id==='host'?S.mpName:MP.players[id].name);if(deckErr(ids.length,names))return;
  const deck=[];for(const r of ['mafia','doctor','detective'])for(let k=0;k<S.counts[r];k++)deck.push(r);while(deck.length<ids.length)deck.push('citizen');
  MP.game={deal:Date.now(),ids,names,roles:shuffle(deck),ready:{}};SND.unlock();NARR.welcome();hostPublish();render();window.scrollTo(0,0);}
function hostReady(){if(!MP.game)return;MP.game.ready.host=true;hostPublish();render();}
function hostBackRoom(){MP.game=null;for(const id in MP.players)if(!MP.players[id].on)delete MP.players[id];hostPublish();render();}
function readyHtml(){const g=MP.game,n=Object.keys(g.ready).length,all=n===g.ids.length;
  let h=`<div class="sec"><div class="sh"><h3>${t('readyN',{n,m:g.ids.length})}</h3></div>`+g.ids.map((id,i)=>{const q=id==='host'?{on:true}:MP.players[id]||{};
    return `<div class="prs"><span class="dot ${q.on?'on':''}"></span><b>${esc(g.names[i])}</b><small style="color:${g.ready[id]?'var(--green)':'var(--dim)'}">${g.ready[id]?'✓ '+t('ready'):q.on?'…':t('offline')}</small></div>`;}).join('')+`</div>`;
  if(all)h+=`<div class="big" style="margin-bottom:12px"><div class="res" style="font-size:20px;color:var(--green)">${t('allReady')}</div></div>
   <button class="btn gold" onclick="hostStartGame()">${t('startNight1')}</button>
   <div class="row2 mt"><button class="btn ghost" onclick="hostDeal()">${t('dealAgain')}</button><button class="btn ghost" onclick="hostBackRoom()">${t('backRoom')}</button></div>`;
  return h;}
function roleCard(name,role,mates,btn){return `<div class="big"><div class="lbl" style="margin-bottom:14px">${t('yourRoleN',{n:esc(name)})}</div>
   <div class="hold" id="hold"><div class="cover">${IC.eye}${t('holdHint')}</div>
   <div class="rv"><div class="ric" style="width:56px;height:56px;background:${RC[role]}1f;color:${RC[role]}">${IC[role]}</div><div class="rn" style="color:${RC[role]}">${t(role)}</div><div class="rd">${t('d_'+role)}</div>${mates&&mates.length?`<div class="mates">${t('mates',{n:mates.map(esc).join(S.lang==='ar'?'، ':', ')})}</div>`:''}</div></div>
   <button class="btn ghost" id="memo" onclick="${btn}" disabled style="opacity:.4">${t('gotIt')}</button></div>`;}
function hostPing(){MP.seq++;hostPublish();toast(t('pinged'));}
function hostStop(){clearInterval(MP.timer);MP.timer=null;if(MP.role==='host'){lsSet(MPK,null);keepOn(false);if(HN){HN.clear();if(HN.close)HN.close();}}MP.role=null;MP.online=null;}
function roomList(players){return players.map(q=>`<div class="prs"><span class="dot ${q.on?'on':''}"></span>${q.uid?avatarHtml(q.av,q.uid,28):''}<b>${esc(q.name)}</b>${q.host?`<small>${t('youHost')}</small>`:''}${q.old?`<small class="oldv">${t('oldApp')}</small>`:''}${plusBtn(q.uid)}</div>`).join('');}
function hostView(){const g=MP.game;
  if(g){const i=g.ids.indexOf('host');
    return head(t('host'))+`<div class="chip" style="display:table;margin:0 auto 12px">${t('rolesDealt')}</div><p class="mpinfo" style="text-align:center">${t('checkPhone')}</p>
     ${g.ready.host?`<div class="big" style="margin-bottom:14px"><div class="res" style="font-size:20px">${t('youReady')}</div></div>`:roleCard(S.mpName,g.roles[i],g.roles[i]==='mafia'?g.names.filter((n,j)=>j!==i&&g.roles[j]==='mafia'):[],'hostReady()')}
     <div id="rdy" class="mt">${readyHtml()}</div>`;}
  const ps=([{name:S.mpName,on:true,host:true}] as RoomPlayer[]).concat(Object.values(MP.players).map(q=>({name:q.name,on:q.on,old:(q.v||0)<APP.code})));
  const ids=hostIds(),err=deckErr(ids.length,ids.map(id=>id==='host'?S.mpName:MP.players[id].name));
  return head(t('host'))+`<div class="big"><div class="chip">${t('roomOpen')}</div><div class="who" style="font-size:28px">${esc(S.mpName)}</div>
   ${MP.online?`<div class="code sel">${MP.online.code.replace(/(\d{3})/,'$1 ')}</div><button class="mini" onclick="copyText(MP.online.code)">${t('copyCode')}</button><p class="hint" style="margin:8px 0 0">${t('codeHint')}</p>`
     :`<p class="hint" style="margin-bottom:0">${MP.myIp?`<span class="ipline sel">${t('hostAddr',{ip:MP.myIp})}</span> <button class="mini" onclick="copyText(MP.myIp)">${t('copy')}</button>`:t('hotspotMode')}</p>`}</div>
  <button class="btn ghost mt" onclick="shareRoom()">${IC.share}${t(MP.online?'shareCode':'shareAddr')}</button>
  ${MP.online?`<button class="btn ghost mt" onclick="dockOpen(true)">${IC.friend}${t('fInviteT')}</button>`:''}
  <div class="sec mt"><div class="sh"><h3>${t('playersIn',{n:ps.length})}</h3><button class="link" onclick="hostPing()">${t('pingAll')}</button></div>${hostRows()}</div>
  ${deckRules(ps.length,err)}
  <button class="btn primary" ${err?'disabled':''} onclick="hostDeal()">${t('dealRoles')}</button>
  <button class="danger" onclick="askLeaveRoom()">${t('closeRoom')}</button>
`;}
const buzzMuted=q=>!!(S.host.buzzMax&&(q.buzz||0)>=S.host.buzzMax);
function hostRows(inGame?: boolean){
  const rows=Object.keys(MP.players).filter(id=>!inGame||(G.ids.indexOf(id)>=0&&G.alive[G.ids.indexOf(id)])).map(id=>{const q=MP.players[id];
    return `<div class="prs"><span class="dot ${q.on?'on':''}"></span>${q.uid?avatarHtml(q.uav,q.uid,28):''}<b>${esc(q.name)}</b>${(q.v||0)<APP.code?`<small class="oldv">${t('oldApp')}</small>`:''}${inGame?'':plusBtn(q.uid)}
     ${buzzMuted(q)?`<button class="mini" onclick="unmute('${id}')">${t('unmute')}</button>`:''}<button class="mini bad" onclick="askKick('${id}')">${t('kick')}</button></div>`;}).join('');
  return (inGame?'':`<div class="prs"><span class="dot on"></span>${me()?avatarHtml(me().avatar,me().id,28):''}<b>${esc(S.mpName)}</b><small>${t('youHost')}</small></div>`)+rows;}
function unmute(id){const q=MP.players[id];if(q){q.buzz=0;hostPublish();render();}}
function askKick(id){const q=MP.players[id];if(!q)return;$('modal').innerHTML='';ask(t('kickQ',{n:esc(q.name)}),t(G&&G.mp?'kickGameD':'kickD'),t('kick'),()=>kick(id));}
function kick(id){const q=MP.players[id];if(!q)return;
  if(G&&G.mp){const i=G.ids.indexOf(id);if(i>=0&&G.alive[i]){G.alive[i]=false;G.hist.push(t('kickedH',{n:G.names[i]}));if(G.votes)delete G.votes[i];if(G.done)G.done[i]=true;}}
  else if(MP.game)MP.game=null;  // roles were dealt for a group that no longer exists: back to the room
  delete MP.players[id];HN.put('p_'+id,JSON.stringify({err:'kicked',h:-1,kicked:Date.now()}));toast(t('kickedT',{n:q.name}));hostPublish();
  if(G&&G.mp&&!checkWin([])){if(G.phase==='mpNight')mpCheckNight();else if(G.phase==='mpVote')mpCheckVote();}
  render();}
function playersSheet(){$('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)$('modal').innerHTML=''"><div class="sheet"><h3>${t('playersT')}</h3><p>${t('kickGameD')}</p>${hostRows(true)}
  <button class="btn ghost mt" onclick="$('modal').innerHTML=''">${t('cancel')}</button></div></div>`;}
