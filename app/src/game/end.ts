/* win */
function checkWin(lead){
  const a=aliveIdx(),m=a.filter(i=>G.roles[i]==='mafia').length,o=a.length-m;
  let w=null;if(m===0)w='citizens';else if(m>=o)w='mafia';
  if(w){stopTimer();const mn=G.names.filter((n,i)=>G.roles[i]==='mafia');if(w==='mafia')NARR.mafiaWin(mn,lead);else NARR.citizensWin(mn,lead);go('end',{winner:w});return true;}return false;
}
function endView(){
  const w=G.winner;
  if(!G.revealed)return suspense(IC.trophy,'',t('gameOver'));
  return recapCard(G)+`
  ${G.logId==null?`<div class="sec" style="border-color:#e8b65a55"><div class="sh"><h3>${t('countQ')}</h3></div><p style="color:var(--mute);font-size:13.5px;line-height:1.5;margin-bottom:12px">${t('countD')}</p>
   <div class="row2"><button class="btn primary" onclick="markGame(true)">${t('valid')}</button><button class="btn ghost" onclick="markGame(false)">${t('invalid')}</button></div></div>`
  :`<div class="sec"><p style="font-size:14px;margin-bottom:12px;color:${G.logValid?'var(--green)':'var(--mute)'}">${t(G.logValid?'markedValid':'markedInvalid')} · <button class="link" style="padding:0" onclick="markGame(${!G.logValid})">${t('change')}</button></p>
   <button class="btn primary" onclick="rematch()">${t('playAgain')}<small>· ${t('sameNew')}</small></button>
   ${G.mp?`<button class="btn ghost mt" onclick="finish()">${t('toLobby')}</button>`:`<div class="row2 mt"><button class="btn ghost" onclick="finish('setup')">${t('changePlayers')}</button><button class="btn ghost" onclick="finish()">${t('home')}</button></div>`}</div>`}`;
}
/* rematch: same players, new roles, no setup screen in between */
function rematch(){if(G&&G.mp){finish();hostDeal();return;}finish('setup');startGame();}
function mvp(g: {winner:Winner;names:string[];roles:Role[];alive:boolean[];ev:GameEv}){const ev: Partial<GameEv>=g.ev||{},idx=g.names.map((n,i)=>i),top=(a: any[])=>{const c: Record<string,number>={};(a||[]).forEach(x=>c[x]=(c[x]||0)+1);return Object.entries(c).sort((x,y)=>y[1]-x[1])[0];};
  if(g.winner==='mafia'){const m=idx.filter(i=>g.roles[i]==='mafia'),al=m.filter(i=>g.alive[i]);return{i:(al.length?al:m)[0],why:t(al.length?'mvpMafia':'mvpMafia2')};}
  const c=top((ev.caught||[]).map(x=>+String(x).split(':')[0]));if(c)return{i:+c[0],why:t('mvpDet',{n:c[1]})};
  const d=top(ev.saves);if(d)return{i:+d[0],why:t('mvpDoc',{n:d[1]})};
  const sv=idx.filter(i=>g.alive[i]&&g.roles[i]!=='mafia');return sv.length?{i:sv[0],why:t('mvpSurv')}:null;}
function recapCard(g){const w=g.winner,m=mvp(g),date=fdate(Date.now());
  return `<div class="recap ${w}"><div class="rc-top"><span class="rc-brand"><i>${IC.logo}</i>Mafia Dealer</span><span>${date}</span></div>
   <div class="rc-win"><div class="orb pop">${w==='mafia'?IC.skull:IC.trophy}</div><div class="res pop">${t('win_'+w)}</div><p>${t('rcSub',{d:g.day,n:g.names.length})}</p></div>
   ${m?`<div class="rc-mvp"><i>${IC.crown}</i><div><small>${t('mvpT')}</small><b>${esc(g.names[m.i])}</b><span>${m.why}</span></div><em style="color:${RC[g.roles[m.i]]}">${t(g.roles[m.i])}</em></div>`:''}
   <div class="rc-roles">${g.names.map((n,i)=>`<span class="${g.alive[i]?'':'out'}" style="--rc:${RC[g.roles[i]]}"><b>${esc(n)}</b><small>${t(g.roles[i])}</small></span>`).join('')}</div>
   ${g.hist.length?`<div class="rc-tl">${g.hist.map(h=>`<div><i>${String(h).indexOf(t('night'))===0?IC.moon:IC.sun}</i><span>${esc(h)}</span></div>`).join('')}</div>`:''}</div>`;}
function addLog(v){const id=Date.now();const e={id,names:G.names,roles:G.roles,alive:G.alive,winner:G.winner,days:G.day,hist:G.hist,valid:v,ev:G.ev,acc:G.acc||null};S.log.unshift(e);
  if(S.group){(S.gcache=S.gcache||[]).unshift(Object.assign({mine:true},e));setTimeout(gSync,0);}if(S.log.length>100)S.log.length=100;return id;}
function markGame(v){if(G.logId==null)G.logId=addLog(v);else{const g=S.log.find(x=>x.id===G.logId);if(g)g.valid=v;
  if(S.group){const c=(S.gcache||[]).find(x=>x.id===G.logId);if(c)c.valid=v;if((S.gsent||[]).includes(G.logId))gReq('/edit',{id:G.logId,valid:v}).catch(()=>{});}}G.logValid=v;save();render();}
function finish(to?: string){hush();if(G&&G.mp){if(G.phase==='end'&&G.logId==null)addLog(true);G=null;save();hostBackRoom();V='host';render();window.scrollTo(0,0);return;}if(G&&G.phase==='end'&&G.logId==null)addLog(true);G=null;S.game=null;V=to||'home';save();render();window.scrollTo(0,0);}
