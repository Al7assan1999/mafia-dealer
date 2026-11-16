/* night */
function startNight(){NARR.night();G.act={mafia:{},doctor:{},detective:{}};if(G.mp){go('mpNight',{done:{},hostTurn:false,hostRes:false,nightEnd:S.rules.nightT?Date.now()+S.rules.nightT*1000:0});return;}const a=aliveIdx();go('nightPass',{i:0,order:a});}
function nightPassView(){
  const p=G.order[G.i];
  return stage(`<div class="big"><div class="chip">${IC.moon.replace('<svg','<svg style="width:15px;height:15px;vertical-align:-2px;margin-inline-end:6px"')}${t('night')} ${G.day} · ${t('turn')} ${G.i+1}/${G.order.length}</div>
   <p class="hint" style="margin-bottom:18px">${t('nightHint')}</p><div class="lbl">${t('passTo')}</div><div class="who">${nm(p)}</div>
   <button class="btn primary mt" onclick="go('nightAct')">${t('open',{n:nm(p)})}</button></div>`);
}
function nightOpts(p: number){const r=G.roles[p];let key: string=r;if(r==='citizen'&&!S.rules.decoy)key='none';const opts=[];let skip=null;
  if(key!=='none'){for(const j of aliveIdx()){let dis=false,tag='';
      if(j===p)tag=t('you');
      if(r==='mafia'&&G.roles[j]==='mafia'){dis=true;tag=j===p?t('you'):t('teammate');}
      if(r==='mafia'&&S.rules.norep&&G.lastTarget===j){dis=true;tag=t('lastTgt');}
      if(r==='doctor'){if(j===p&&!S.rules.self)dis=true;if(S.rules.rep&&G.lastProt[p]===j){dis=true;tag=t('lastNight');}}
      if(r==='detective'&&j===p)dis=true;
      if(r==='mafia'){const mv=Object.entries(G.act.mafia).filter(([k,v])=>+k!==p&&+v===j).length;if(mv)tag=(tag?tag+' · ':'')+t('mateVote');}
      opts.push({j,name:G.names[j],tag,dis,red:r==='mafia'&&G.roles[j]==='mafia'});}
    if(r==='mafia'&&S.rules.skip&&!G.skipUsed)skip={mv:Object.entries(G.act.mafia).filter(([k,v])=>+k!==p&&v==='skip').length};}
  return{key,opts,skip};}
function nightActView(){
  const p=G.order[G.i],r=G.roles[p];
  let key: string=r; if(r==='citizen'&&!S.rules.decoy)key='none';
  const alive=aliveIdx();
  let rows='';
  if(key!=='none'){
    for(const j of alive){
      let dis=false,tag='';
      if(j===p)tag=t('you');
      if(r==='mafia'&&G.roles[j]==='mafia'){dis=true;tag=j===p?t('you'):t('teammate');}
      if(r==='mafia'&&S.rules.norep&&G.lastTarget===j){dis=true;tag=t('lastTgt');}
      if(r==='doctor'){if(j===p&&!S.rules.self)dis=true;if(S.rules.rep&&G.lastProt[p]===j){dis=true;tag=t('lastNight');}}
      if(r==='detective'&&j===p)dis=true;
      if(r==='mafia'){const mv=Object.entries(G.act.mafia).filter(([k,v])=>+v===j).length;if(mv)tag=(tag?tag+' · ':'')+t('mateVote');}
      rows+=optBtn(j,nm(j),tag,dis,r==='mafia'&&G.roles[j]==='mafia');
    }
    if(r==='mafia'&&S.rules.skip&&!G.skipUsed){
      const mv=Object.values(G.act.mafia).filter(v=>v==='skip').length;
      rows+=`<button class="opt skip ${G.sel==='skip'?'sel':''}" onclick="pick('skip')"><b>${t('skipKill')}<br><span class="skipleft">${t('skipLeft')}${mv?' · '+t('mateVote'):''}</span></b><span class="rad"></span></button>`;
    }
  }
  return stage(`<div class="act"><div class="ah"><span>${nm(p)}</span><span>${t('night')} ${G.day}</span></div>
   <h2>${t('a_'+key)}</h2><p class="d">${t('a_'+key+'_d')}</p>
   ${rows?`<div class="list">${rows}</div>`:''}
   <button class="btn primary" ${key!=='none'&&G.sel===null?'disabled':''} onclick="lockNight()">${IC.lock.replace('<svg','<svg style="width:20px;height:20px"')}${t('confirm')}</button></div>`);
}
const optBtn=(j,name,tag,dis,red)=>`<button class="opt ${G.sel===j?'sel':''}" ${dis?'disabled':''} onclick="pick(${j})"><span class="num">${j+1}</span><b>${name}</b>${tag?`<small class="${red?'tag':''}">${esc(tag)}</small>`:''}<span class="rad"></span></button>`;
function pick(j){G.sel=j;render();}
function lockNight(){
  const p=G.order[G.i],r=G.roles[p];
  if(r==='mafia')G.act.mafia[p]=G.sel;
  if(r==='doctor')G.act.doctor[p]=G.sel;
  if(r==='detective')G.act.detective[p]=G.sel;
  go('nightDone');
}
function nightDoneView(){
  const p=G.order[G.i],r=G.roles[p],last=G.i===G.order.length-1;
  let body=`<div class="orb">${IC.lock}</div><div class="res">${t('locked')}</div><p class="hint">${t('lockedHint')}</p>`;
  if(r==='detective'&&G.act.detective[p]!=null){
    const q=G.act.detective[p],is=G.roles[q]==='mafia';
    body=`<div class="orb" style="color:${is?'var(--red2)':'var(--green)'}">${IC.detective}</div><div class="res" style="color:${is?'var(--red2)':'var(--green)'}">${t(is?'isMafia':'notMafia',{n:nm(q)})}</div><p class="hint">${t('lockedHint')}</p>`;
  }
  return stage(`<div class="big">${body}<button class="btn ghost" onclick="nightNext()">${last?t('doneLast'):t('done')}</button></div>`);
}
function nightNext(){if(G.i<G.order.length-1)go('nightPass',{i:G.i+1});else go('dawn');}
function dawnView(){return stage(`<div class="big"><div class="orb">${IC.sun}</div><div class="res">${t('allDone')}</div><p class="hint">${t('allDoneHint')}</p><button class="btn gold" onclick="resolveNight()">${t('dawn')}</button></div>`);}
function resolveNight(){
  // Mafia decision: most votes among living mafia; ties broken randomly
  const votes=Object.values(G.act.mafia);let target=null,skip=false;
  if(votes.length){
    const c: Record<string,number>={};votes.forEach(v=>{c[v]=(c[v]||0)+1;});
    const max=Math.max(...Object.values(c));const top=Object.keys(c).filter(k=>c[k]===max);
    const w=top[crypto.getRandomValues(new Uint32Array(1))[0]%top.length];
    if(w==='skip'){skip=true;G.skipUsed=true;}else target=+w;
  }
  const prot=new Set(Object.values(G.act.doctor).map(Number));
  G.lastProt=Object.assign({},G.act.doctor);
  let dead=null,h=t('h_night',{d:G.day});const parts=[];
  if(skip)parts.push(t('h_skip'));
  else if(target!=null){if(prot.has(target))parts.push(t('h_saved',{n:G.names[target]}));else{dead=target;G.alive[target]=false;parts.push(t('h_kill',{n:G.names[target]}));}}
  else parts.push(t('h_nomafia'));
  Object.values(G.act.doctor).filter(q=>q!=null).forEach(q=>parts.push(t('h_prot',{n:G.names[q]})));
  Object.values(G.act.detective).filter(q=>q!=null).forEach(q=>parts.push(t('h_check',{n:G.names[q]})));
  G.hist.push(h+parts.join(' · '));
  G.ev=G.ev||{first:null,saves:[],caught:[]};
  G.lastTarget=target;G.savedP=(target!=null&&prot.has(target)&&S.rules.saverev)?target:null;
  if(target!=null&&prot.has(target))Object.entries(G.act.doctor).forEach(([p,q])=>{if(+q===target)G.ev.saves.push(+p);});
  if(dead!=null&&G.ev.first==null)G.ev.first=dead;
  if(dead!=null)(G.ev.kills=G.ev.kills||[]).push(dead);
  Object.entries(G.act.detective).forEach(([p,q])=>{if(G.roles[q]==='mafia'&&!G.ev.caught.includes(p+':'+q))G.ev.caught.push(p+':'+q);});
  G.morning=dead;
  if(checkWin(dead!=null?['v_killed_1',VOX.name(G.names[dead],1)]:[]))return;
  NARR.morning(dead!=null?G.names[dead]:null,dead!=null&&S.rules.reveal?G.roles[dead]:null,G.savedP!=null?G.names[G.savedP]:null);
  go('morning');
}
function suspense(icon,chip,txt){return stage(`<div class="big">${chip?`<div class="chip">${chip}</div>`:''}<div class="orb pulse">${icon}</div><div class="res">${txt}</div><div class="dots">•••</div><button class="link" onclick="revealNow()">${t('skipWait')}</button></div>`);}
function morningView(){
  const d=G.morning;
  if(!G.revealed)return suspense(IC.sun,t('morning')+' '+G.day,t('sunrise'));
  let body=d==null?(G.savedP!=null?`<div class="orb pop">${IC.shield}</div><div class="lbl">${t('savedIs')}</div><div class="victim pop" style="color:var(--green)">${nm(G.savedP)}</div><p class="hint" style="margin:0">${t('nobody')}</p>`:`<div class="orb pop">${IC.shield}</div><div class="res pop" style="color:var(--green)">${t('nobody')}</div>`)
   :`<div class="orb pop">${IC.skull}</div><div class="lbl">${t('victimIs')}</div><div class="victim pop" style="color:var(--red2)">${nm(d)}</div>${S.rules.reveal?`<p class="hint">${t('wasRole',{r:t(G.roles[d])})}</p>`:''}`;
  return stage(`<div class="big"><div class="chip">${t('morning')} ${G.day}</div>${body}<div style="height:16px"></div>${roster()}<div style="height:18px"></div>
   <button class="btn primary" onclick="startDay()">${t('startDay',{d:G.day})}</button></div>`);
}
const roster=()=>`<div class="roster" style="justify-content:center">${G.names.map((n,i)=>`<span class="${G.alive[i]?'':'dead'}">${esc(n)}</span>`).join('')}</div>`;
