const won=(g,i)=>g.roles[i]==='mafia'?g.winner==='mafia':g.winner==='citizens';
/** One player's totals over the valid games (key: account or typed name). q: has the 3 games to be ranked; r: win rate. */
interface PlayerStat { key: string; name: string; g: number; w: number; mg: number; mw: number; tg: number; tw: number; sv: number; ct: number; fk: number; q?: boolean; r?: number }
function stats(){const P: Record<string,PlayerStat>={};
  LOG().filter(g=>g.valid).forEach(g=>g.names.forEach((n,i)=>{const k=seatKey(g,i),p=P[k]||(P[k]={key:k,name:n,g:0,w:0,mg:0,mw:0,tg:0,tw:0,sv:0,ct:0,fk:0});
    const maf=g.roles[i]==='mafia',w=won(g,i);p.g++;if(w)p.w++;if(maf){p.mg++;if(w)p.mw++;}else{p.tg++;if(w)p.tw++;}
    const e: Partial<GameEv>=g.ev||{};if(e.first===i)p.fk++;(e.saves||[]).forEach(x=>{if(x===i)p.sv++;});(e.caught||[]).forEach(x=>{if(+String(x).split(':')[0]===i)p.ct++;});}));
  const all=Object.values(P);all.forEach(p=>{p.q=p.g>=3;p.r=p.w/p.g;});
  const board=all.slice().sort((a,b)=>(+b.q - +a.q)||(b.r-a.r)||(b.w-a.w)||(b.g-a.g));
  const top=f=>all.filter(p=>f(p)>0).sort((a,b)=>f(b)-f(a))[0]||null;
  const bm=all.filter(p=>p.mg>=2&&p.mw>0).sort((a,b)=>(b.mw/b.mg-a.mw/a.mg)||(b.mw-a.mw))[0]||null;
  return{board,best:board.find(p=>p.q)||null,bestMafia:bm,bestDet:top(p=>p.ct),bestDoc:top(p=>p.sv),firstKilled:top(p=>p.fk)};}
let BOARD: PlayerStat[]=[],PROF: string=null;
const seatKey=(g,i)=>g.acc&&g.acc[i]?'a:'+g.acc[i]:nkey(g.names[i]);  // accounts first, typed names otherwise
let PROFN='',profRet='stats';  // the screen Back returns to
function openProfile(i){const p=BOARD[i];if(!p)return;if(p.key.indexOf('a:')===0){openAcct(p.key.slice(2),p.name);return;}PROF=p.key;PROFN=p.name;if(V!=='profile')profRet=V;nav('profile');}
function profileView(){const k=PROF||'',games=LOG().filter(g=>g.valid&&g.names.some((n,i)=>seatKey(g,i)===k)),acc=k.indexOf('a:')===0;
  if(!games.length)return head(esc(PROFN||''))+(acc?acctCard(k.slice(2)):'')+`<div class="empty">${t(acc?'fNoGames':'noStats')}</div>`;
  const R={mafia:[0,0],doctor:[0,0],detective:[0,0],citizen:[0,0]},by: Record<string,{n:string;c:number}>={};let w=0,sv=0,ct=0,kd=0,vo=0,form=[];
  games.forEach(g=>{const i=g.names.findIndex((n,j)=>seatKey(g,j)===k),r=g.roles[i],x=won(g,i),e: Partial<GameEv>=g.ev||{};R[r][0]++;if(x){R[r][1]++;w++;}if(form.length<8)form.push(x);
    sv+=(e.saves||[]).filter(q=>q===i).length;ct+=(e.caught||[]).filter(q=>+String(q).split(':')[0]===i).length;vo+=(e.outs||[]).filter(q=>q===i).length;
    (e.kills||[]).filter(q=>q===i).forEach(()=>{kd++;g.names.forEach((n,j)=>{if(g.roles[j]==='mafia'&&j!==i){const kk=nkey(n);by[kk]=by[kk]||{n,c:0};by[kk].c++;}});});});
  const pct=(a,b)=>b?Math.round(a/b*100)+'%':'–',side=[R.doctor,R.detective,R.citizen].reduce((a,b)=>[a[0]+b[0],a[1]+b[1]],[0,0]);
  const best=Object.keys(R).filter(r=>R[r][0]>=2).sort((a,b)=>(R[b][1]/R[b][0]-R[a][1]/R[a][0])||(R[b][0]-R[a][0]))[0]||Object.keys(R).sort((a,b)=>R[b][0]-R[a][0])[0];
  const nem=Object.values(by).sort((a,b)=>b.c-a.c)[0];
  return head(esc(PROFN))+(acc?acctCard(k.slice(2)):'')+`<div class="titles"><div class="ttl wide"><i>${t('winRate')}</i><b>${pct(w,games.length)}</b><span>${t('winsOf',{w,g:games.length})}</span></div>
    <div class="ttl"><i>${t('bestRole')}</i><b style="color:${RC[best]}">${t(best)}</b><span>${t('winsOf',{w:R[best][1],g:R[best][0]})}</span></div>
    <div class="ttl"><i>${t('asMafiaT')}</i><b>${pct(R.mafia[1],R.mafia[0])}</b><span>${t('winsOf',{w:R.mafia[1],g:R.mafia[0]})}</span></div>
    <div class="ttl"><i>${t('asTownT')}</i><b>${pct(side[1],side[0])}</b><span>${t('winsOf',{w:side[1],g:side[0]})}</span></div>
    <div class="ttl"><i>${t('nemesis')}</i><b>${nem?esc(nem.n):'–'}</b><span>${nem?t('nTimes',{n:nem.c}):t('nemesisNone')}</span></div></div>
   <div class="sec"><div class="sh"><h3>${t('byRole')}</h3></div>${Object.keys(R).map(r=>`<div class="rbar"><b style="color:${RC[r]}">${t(r)}</b><div><i style="width:${R[r][0]?Math.round(R[r][1]/R[r][0]*100):0}%;background:${RC[r]}"></i></div><span>${R[r][1]}/${R[r][0]}</span></div>`).join('')}</div>
   <div class="sec"><div class="sh"><h3>${t('moments')}</h3></div><div class="pstat"><span><b>${sv}</b>${t('psSaves')}</span><span><b>${ct}</b>${t('psCaught')}</span><span><b>${kd}</b>${t('psKilled')}</span><span><b>${vo}</b>${t('psOut')}</span></div></div>
   <div class="sec"><div class="sh"><h3>${t('form')}</h3></div><div class="form">${form.map(x=>`<span class="${x?'w':'l'}">${x?t('fW'):t('fL')}</span>`).join('')}</div></div>`;}
function statsView(){const st=stats();let h=head(t('statsT'));
  if(!st.board.length)return h+`<div class="empty">${t('noStats')}</div>`;
  const card=(k: string,p: PlayerStat,sub: string,wide?: boolean)=>p?`<div class="ttl ${wide?'wide':''}"><i>${t(k)}</i><b>${esc(p.name)}</b><span>${sub}</span></div>`:'';
  h+=`<div class="titles">${card('tBest',st.best,st.best?Math.round(st.best.r*100)+'% · '+t('winsOf',{w:st.best.w,g:st.best.g}):'',true)}
   ${card('tMafia',st.bestMafia,st.bestMafia?t('asMafia',{w:st.bestMafia.mw,g:st.bestMafia.mg}):'')}${card('tDet',st.bestDet,st.bestDet?t('caught',{n:st.bestDet.ct}):'')}
   ${card('tDoc',st.bestDoc,st.bestDoc?t('savesN',{n:st.bestDoc.sv}):'')}${card('tFirst',st.firstKilled,st.firstKilled?t('timesN',{n:st.firstKilled.fk}):'')}</div>
  <div class="sec"><div class="sh"><h3>${t('board')}</h3></div><p style="color:var(--mute);font-size:12.5px;margin-bottom:6px;line-height:1.5">${t('boardD')}</p>`;
  BOARD=st.board;let rk=0;st.board.forEach((p,bi)=>{if(p.q)rk++;h+=`<div class="lb tap ${p.q?'':'nq'}" onclick="openProfile(${bi})"><div class="rk ${p.q&&rk===1?'g1':''}">${p.q?rk:'–'}</div><div class="nm"><b>${esc(p.name)}</b><span>${t('sideLine',p)}</span></div>
   <div class="pc">${p.q?Math.round(p.r*100)+'%':t('need3g')}<span>${p.w}/${p.g} ${t('wins')}</span></div></div>`;});
  return h+`</div>`;}
