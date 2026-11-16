function histFilter(){const q=nkey(F.q);return LOG().filter(g=>{if(F.w!=='all'&&g.winner!==F.w)return false;if(F.v==='valid'&&!g.valid)return false;if(F.v==='invalid'&&g.valid)return false;
  if(!q)return true;return g.names.some((n,i)=>nkey(n).includes(q)&&(F.role==='any'||g.roles[i]===F.role)&&(F.res==='any'||(F.res==='won')===won(g,i)));});}
const fchip=(grp,val,label)=>`<button class="chipb ${F[grp]===val?'on':''}" onclick="setF('${grp}','${val}')">${label}</button>`;
function setF(g,v){F[g]=v;$('hlist').innerHTML=histList();}
function histList(){const q=F.q.trim(),list=histFilter();
  let h=`<div class="flbl">${t('fWinner')}</div><div class="chips">${fchip('w','all',t('fAll'))}${fchip('w','mafia',t('fMafia'))}${fchip('w','citizens',t('fCit'))}</div>
  <div class="flbl">${t('fState')}</div><div class="chips">${fchip('v','all',t('fAll'))}${fchip('v','valid',t('fValid'))}${fchip('v','invalid',t('fInvalid'))}</div>`;
  if(q)h+=`<div class="flbl">${t('fRole',{n:esc(q)})}</div><div class="chips">${fchip('role','any',t('fAny'))}${['mafia','citizen','doctor','detective'].map(r=>fchip('role',r,t(r))).join('')}</div>
  <div class="flbl">${t('fRes',{n:esc(q)})}</div><div class="chips">${fchip('res','any',t('fAny'))}${fchip('res','won',t('fWon'))}${fchip('res','lost',t('fLost'))}</div>`;
  h+=`<div class="flbl" style="margin-top:12px">${t('nGames',{n:list.length})}</div>`;
  if(!list.length)return h+`<div class="empty">${t(LOG().length?'noMatch':'noGames')}</div>`;
  return h+list.map(g=>`<button class="gcard ${g.valid?'':'inv'}" onclick="nav('game:${g.id}')"><div class="r1"><b style="color:${g.winner==='mafia'?'var(--red2)':'var(--gold)'}">${t('win_'+g.winner)}${g.valid?'':`<span class="tagi">${t('invalidTag')}</span>`}</b><span>${fdate(g.id)}</span></div>
   <div class="r2">${g.names.length} ${t('pl')} · ${g.days} ${t('rounds')} · ${t('mafia')}: ${g.names.filter((n,i)=>g.roles[i]==='mafia').map(esc).join(', ')}</div></button>`).join('');}
function historyView(){return head(t('historyT'))+`<input class="search" placeholder="${t('searchPh')}" value="${esc(F.q)}" oninput="F.q=this.value;$('hlist').innerHTML=histList()"><div id="hlist">${histList()}</div>
  ${S.group?`<p class="mpinfo" style="text-align:center;margin-top:10px">${t('gHistNote',{c:S.group.code})}</p>`:S.log.length?`<button class="danger" onclick="ask(t('clearQ'),t('clearD',{n:S.log.length}),t('clearAll'),()=>{S.log=[];save();render();})">${t('clearAll')}</button>`:''}`;}
function gameView(id){const g=LOG().find(x=>x.id===id);if(!g){V='history';return historyView();}
  return head(fdate(g.id))+`<div class="big"><div class="orb">${g.winner==='mafia'?IC.skull:IC.trophy}</div><div class="res" style="color:${g.winner==='mafia'?'var(--red2)':'var(--gold)'}">${t('win_'+g.winner)}</div>
   <p class="hint" style="margin-bottom:0">${g.names.length} ${t('pl')} · ${g.days} ${t('rounds')}${g.valid?'':` · ${t('invalidTag')}`}</p></div>
  <div class="sec mt"><div class="sh"><h3>${t('roles')}</h3></div>${g.names.map((n,i)=>`<div class="endrow">${g.alive[i]?`<span>${esc(n)}</span>`:`<s>${esc(n)}</s>`}<b style="color:${RC[g.roles[i]]}">${t(g.roles[i])}</b></div>`).join('')}</div>
  <div class="sec"><div class="sh"><h3>${t('history')}</h3></div><div class="log">${g.hist.map(esc).join('<br>')}</div></div>
  ${canEdit(g)?`<button class="btn ghost" onclick="toggleValid(${g.id})">${t(g.valid?'markInvalid':'markValid')}</button>
  <button class="danger" onclick="ask(t('delQ'),t(S.group?'delGD':'delD'),t('del'),()=>delGame(${g.id}))">${t('delGame')}</button>`:`<p class="mpinfo" style="text-align:center">${t('gNotMine')}</p>`}`;}
const canEdit=g=>!S.group||!!g.mine;
function toggleValid(id){const g=LOG().find(x=>x.id===id);if(!g||!canEdit(g))return;g.valid=!g.valid;const l=S.log.find(x=>x.id===id);if(l&&l!==g)l.valid=g.valid;
  if(S.group)gReq('/edit',{id,valid:g.valid}).catch(()=>{});save();render();}
function delGame(id){S.log=S.log.filter(x=>x.id!==id);if(S.group){S.gcache=(S.gcache||[]).filter(x=>x.id!==id);gReq('/edit',{id,del:1}).catch(()=>{});}save();V='history';render();}
