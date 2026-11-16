/* multiplayer game on the host (reuses the single-phone engine) */
function hostStartGame(){const g=MP.game;if(!g)return;
  G={mp:true,acc:g.ids.map(id=>id==='host'?(me()?me().id:null):((MP.players[id]||{}).uid||null)),ids:g.ids.slice(),ev:{first:null,saves:[],caught:[]},names:g.names.slice(),roles:g.roles.slice(),alive:g.names.map(()=>true),day:1,phase:'deal',i:0,sel:null,
     skipUsed:false,act:{},lastProt:{},hist:[],morning:null,ballots:{},verdict:null,winner:null,mode:'ballot',revealed:false,done:{},votes:{}};
  SND.unlock();startNight();}
const hostIdx=()=>G.ids.indexOf('host');
const isOn=i=>G.ids[i]==='host'||!!(MP.players[G.ids[i]]||{}).on;
function mpRecord(i,sel){const r=G.roles[i];if(r==='mafia')G.act.mafia[i]=sel;if(r==='doctor')G.act.doctor[i]=sel;if(r==='detective')G.act.detective[i]=sel;G.done[i]=true;}
function mpCheckNight(){if(G&&G.phase==='mpNight'&&!G.hostTurn&&aliveIdx().every(i=>G.done[i]))go('dawn');}
function mpCheckVote(){if(G&&G.phase==='mpVote'&&!G.hostTurn&&aliveIdx().every(i=>G.votes[i]!==undefined))tallyVotes(G.votes);}
function mpStartVote(open){stopTimer();go('mpVote',{votes:{},voteId:Date.now(),hostTurn:false,open:!!open});}
const voteBoard=()=>aliveIdx().map(k=>({n:G.names[k],v:G.votes[k]===undefined?null:G.votes[k]==='none'?'none':G.votes[k]==='abstain'?'abstain':G.names[G.votes[k]]}));
const boardHtml=bd=>bd?`<div class="sec board"><div class="sh"><h3>${t('liveVotes')}</h3></div>${bd.map(x=>`<div class="endrow"><span>${esc(x.n)}</span><b class="${x.v?'':'pend'}">${x.v==null?t('notYet'):x.v==='none'?t('noOne'):x.v==='abstain'?t('abstained'):'→ '+esc(x.v)}</b></div>`).join('')}</div>`:'';
function mpStuck(){const night=G.phase==='mpNight';return aliveIdx().filter(i=>!isOn(i)&&(night?!G.done[i]:G.votes[i]===undefined));}
function mpSkipStuck(){mpStuck().forEach(i=>{if(G.phase==='mpNight')G.done[i]=true;else G.votes[i]='abstain';});hostPublish();if(G.phase==='mpNight')mpCheckNight();else mpCheckVote();if(G&&(G.phase==='mpNight'||G.phase==='mpVote'))render();}
function mpProg(){const night=G.phase==='mpNight',al=aliveIdx(),n=al.filter(i=>night?G.done[i]:G.votes[i]!==undefined).length,st=mpStuck();
  return `<div class="res" style="font-size:22px">${t(night?'doneN':'votedN',{n,m:al.length})}</div>`+(night&&G.nightEnd?`<p class="hint" style="margin:4px 0">${t('autoSkip',{n:fmt(Math.max(0,Math.round((G.nightEnd-Date.now())/1000)))})}</p>`:'')+(st.length?`<p class="hint" style="margin:8px 0">${t('offlineWait',{n:st.map(i=>esc(G.names[i])).join(', ')})}</p><button class="btn ghost" onclick="mpSkipStuck()">${t('continueAnyway')}</button>`:'');}
function pubMsg(){
  if(G.phase==='morning'&&G.revealed){const d=G.morning;if(d!=null)return{k:'killed',n:G.names[d],r:S.rules.reveal?G.roles[d]:null};if(G.savedP!=null)return{k:'savedIs',n:G.names[G.savedP]};return{k:'nobody'};}
  if(G.phase==='verdict'&&G.revealed){const v=G.verdict;if(v.j!=null)return{k:'out',n:G.names[v.j],r:S.rules.reveal?G.roles[v.j]:null,tally:v.tally};return{k:v.kind==='tie'?'tie':'skipped',tally:v.tally};}
  return null;}
/** What player i's phone gets during the game (st.g): their role, the phase and only what they may see. */
function mpPriv(i: number){const r=G.roles[i];
  const b: Record<string,any>={deal:MP.game.deal,role:r,mates:r==='mafia'?G.names.filter((n,j)=>j!==i&&G.roles[j]==='mafia'):[],alive:G.alive[i],day:G.day,
    tm:G.phase==='mpNight'&&G.nightEnd?{end:G.nightEnd}:G.phase==='day'?(timer.run?{end:Math.round(((timer.at||Date.now())+timer.left*1000)/1000)*1000}:{left:timer.left}):null,
    roster:G.names.map((n,j)=>({name:n,alive:G.alive[j]})),msg:pubMsg()};
  if(r==='detective'&&G.act&&G.act.detective&&G.act.detective[i]!=null&&G.phase!=='mpNight'){const q=G.act.detective[i];b.check={n:G.names[q],m:G.roles[q]==='mafia'};}
  if(G.phase==='end')return Object.assign(b,{ph:'end',winner:G.winner,roles:G.roles,recap:{winner:G.winner,names:G.names,roles:G.roles,alive:G.alive,day:G.day,hist:G.hist,ev:G.ev}});
  const al=aliveIdx();
  if(!G.alive[i])return Object.assign(b,{ph:'dead',label:G.phase},S.rules.ghost?{roles:G.roles}:{});
  if(G.phase==='mpNight'){
    if(G.done[i]){const x: Record<string,any>={ph:'nightDone',n:G.day,doneN:al.filter(k=>G.done[k]).length,total:al.length};
      if(r==='detective'&&G.act.detective[i]!=null){const q=G.act.detective[i];x.check={n:G.names[q],m:G.roles[q]==='mafia'};}return Object.assign(b,x);}
    return Object.assign(b,{ph:'night',n:G.day},nightOpts(i));}
  if(G.phase==='mpVote'){
    const bd=G.open?{board:voteBoard(),open:1}:{};
    if(G.votes[i]!==undefined)return Object.assign(b,{ph:'voted',v:G.voteId,doneN:al.filter(k=>G.votes[k]!==undefined).length,total:al.length},bd);
    return Object.assign(b,{ph:'vote',v:G.voteId,opts:al.map(j=>({j,name:G.names[j],tag:j===i?t('you'):'',dis:j===i}))},bd);}
  return Object.assign(b,{ph:'table',label:G.phase});}
function mpNightView(){const hi=hostIdx();
  if(G.hostTurn){
    if(G.hostRes){const q=G.act.detective[hi];let body=`<div class="orb">${IC.lock}</div><div class="res">${t('locked')}</div>`;
      if(G.roles[hi]==='detective'&&q!=null){const is=G.roles[q]==='mafia';body=`<div class="orb" style="color:${is?'var(--red2)':'var(--green)'}">${IC.detective}</div><div class="res" style="color:${is?'var(--red2)':'var(--green)'}">${t(is?'isMafia':'notMafia',{n:nm(q)})}</div>`;}
      return stage(`<div class="big">${body}<div style="height:16px"></div><button class="btn ghost" onclick="G.hostTurn=false;G.hostRes=false;mpCheckNight();if(G&&G.phase==='mpNight')render()">${t('done')}</button></div>`);}
    const no=nightOpts(hi),rows=nightRows(no);
    return stage(`<div class="act"><div class="ah"><span>${nm(hi)}</span><span>${t('night')} ${G.day}</span></div><h2>${t('a_'+no.key)}</h2><p class="d">${t('a_'+no.key+'_d')}</p>
     ${rows?`<div class="list">${rows}</div>`:''}<button class="btn primary" ${no.key!=='none'&&G.sel===null?'disabled':''} onclick="mpRecord(hostIdx(),nightOpts(hostIdx()).key==='none'?null:G.sel);G.hostRes=true;hostPublish();render()">${IC.lock.replace('<svg','<svg style="width:20px;height:20px"')}${t('confirm')}</button></div>`);}
  return stage(`<div class="big"><div class="chip">${IC.moon.replace('<svg','<svg style="width:15px;height:15px;vertical-align:-2px;margin-inline-end:6px"')}${t('night')} ${G.day}</div>
   <p class="hint">${t('mpNightHint')}</p><div id="mpprog">${mpProg()}</div>
   ${G.alive[hi]&&!G.done[hi]?`<div style="height:14px"></div><button class="btn primary" onclick="G.hostTurn=true;G.sel=null;render()">${t('myTurn')}</button>`:''}</div>`);}
function mpVoteView(){const hi=hostIdx();
  if(G.hostTurn){let rows=`<button class="opt skip ${G.sel==='none'?'sel':''}" onclick="pick('none')"><b>${t('noOne')}</b><span class="rad"></span></button>`;
    aliveIdx().forEach(j=>rows+=optBtn(j,nm(j),j===hi?t('you'):'',j===hi,false));
    return stage(`<div class="act"><div class="ah"><span>${nm(hi)}</span><span>${t('ballot')}</span></div><h2>${t('votePick')}</h2><div style="height:8px"></div><div class="list">${rows}</div>
     <button class="btn primary" ${G.sel===null?'disabled':''} onclick="G.votes[hostIdx()]=G.sel;G.hostTurn=false;hostPublish();mpCheckVote();if(G&&G.phase==='mpVote')render()">${t('castVote')}</button></div>`);}
  return stage(`<div class="big"><div class="chip">${t(G.open?'tableVote':'ballot')} · ${t('round')} ${G.day}</div><p class="hint">${t(G.open?'mpTableHint':'mpBallotHint')}</p><div id="mpprog">${mpProg()}</div>
   ${G.alive[hi]&&G.votes[hi]===undefined?`<div style="height:14px"></div><button class="btn primary" onclick="G.hostTurn=true;G.sel=null;render()">${t('castMine')}</button>`:''}</div>${G.open?`<div id="hboard">${boardHtml(voteBoard())}</div>`:''}`);}
