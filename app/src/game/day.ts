/* day */
function startDay(){NARR.day();stopTimer();timer.left=S.rules.timer;go('day',{ballots:{}});}
function dayView(){
  const alive=aliveIdx();
  let h=`<div class="sec"><div class="sh"><h3>${t('discussion')} · ${t('round')} ${G.day}</h3></div>
  <div class="timer"><div class="t ${timer.left<=10?'low':''}" id="tt">${fmt(timer.left)}</div>
  <button class="tb ${timer.run?'':'go'}" onclick="toggleTimer()">${timer.run?t('pause'):t('start')}</button><button class="tb" onclick="timer.left+=60;upd()">+1m</button><button class="tb" onclick="stopTimer();timer.left=S.rules.timer;render()">${t('reset')}</button></div></div>
  <div class="sec"><div class="tabs"><button class="${G.mode==='consensus'?'on':''}" onclick="G.mode='consensus';G.sel=null;render()">${t(G.mp?'tableVote':'consensus')}</button><button class="${G.mode==='ballot'?'on':''}" onclick="G.mode='ballot';render()">${t('ballot')}</button></div>`;
  if(G.mode==='consensus'&&G.mp){
    h+=`<p style="color:var(--mute);font-size:14px;margin-bottom:12px">${t('mpTableStart')}</p><button class="btn primary" onclick="mpStartVote(true)">${t('startTable')}</button>`;
  }else if(G.mode==='consensus'){
    h+=`<p style="color:var(--mute);font-size:14px;margin-bottom:10px">${t('whoOut')}</p><div class="list" style="max-height:none">
    <button class="opt skip ${G.sel==='none'?'sel':''}" onclick="pick('none')"><b>${t('noOne')}</b><span class="rad"></span></button>`;
    alive.forEach(j=>h+=optBtn(j,nm(j),'',false,false));
    h+=`</div><button class="btn primary" ${G.sel===null?'disabled':''} onclick="dayDecide()">${t('confirmDay')}</button>`;
  }else{
    h+=`<p style="color:var(--mute);font-size:14px;margin-bottom:12px">${t(G.mp?'mpBallotHint':'ballotHint')}</p><button class="btn primary" onclick="stopTimer();${G.mp?'mpStartVote()':`go('ballotPass',{i:0,order:aliveIdx(),ballots:{}})`}">${t('startBallot')}</button>`;
  }
  return h+`</div>`;
}
function toggleTimer(){if(timer.run)stopTimer();else{timer.run=true;timer.at=Date.now();timer.h=setInterval(()=>{timer.at=Date.now();timer.left--;if(timer.left<=0){timer.left=0;stopTimer();alarm();NARR.timeUp();render();return;}upd();},1000);}render();}
function stopTimer(){timer.run=false;if(timer.h)clearInterval(timer.h);timer.h=null;}
function upd(){const e=$('tt');if(e){e.textContent=fmt(timer.left);e.classList.toggle('low',timer.left<=10);}}
function alarm(){try{navigator.vibrate&&navigator.vibrate([400,150,400]);}catch(e){}return;
  try{const A=new (window.AudioContext||window.webkitAudioContext)();[0,.35,.7].forEach(s=>{const o=A.createOscillator(),g=A.createGain();o.frequency.value=880;o.connect(g);g.connect(A.destination);g.gain.setValueAtTime(.25,A.currentTime+s);g.gain.exponentialRampToValueAtTime(.001,A.currentTime+s+.3);o.start(A.currentTime+s);o.stop(A.currentTime+s+.3);});}catch(e){}}
function dayDecide(){stopTimer();applyVerdict(G.sel==='none'?null:G.sel,G.sel==='none'?'skipped':'out',null);}
function ballotPassView(){
  const p=G.order[G.i];
  return stage(`<div class="big"><div class="chip">${t('voteOf')} ${G.i+1}/${G.order.length}</div><div class="orb">${IC.phone}</div><div class="lbl">${t('passTo')}</div><div class="who">${nm(p)}</div>
   <p class="hint">${t('tiltHint')}</p><button class="btn primary" onclick="go('ballotAct')">${t('iam',{n:nm(p)})}</button></div>`);
}
function ballotActView(){
  const p=G.order[G.i];let rows=`<button class="opt skip ${G.sel==='none'?'sel':''}" onclick="pick('none')"><b>${t('noOne')}</b><span class="rad"></span></button>`;
  aliveIdx().forEach(j=>rows+=optBtn(j,nm(j),j===p?t('you'):'',j===p,false));
  return stage(`<div class="act"><div class="ah"><span>${nm(p)}</span><span>${t('ballot')}</span></div><h2>${t('votePick')}</h2><div style="height:8px"></div>
   <div class="list">${rows}</div><button class="btn primary" ${G.sel===null?'disabled':''} onclick="castVote()">${t('castVote')}</button></div>`);
}
function tallyVotes(ballots: Record<number,any>){
  const c: Record<string,number>={};Object.values(ballots).filter(v=>v!=='abstain'&&v!=null&&(S.rules.skipVote!==false||v!=='none')).forEach(v=>{c[v]=(c[v]||0)+1;});  // skipVote off: skip = abstain
  if(!Object.keys(c).length){applyVerdict(null,'skipped','');return;}
  const max=Math.max(...Object.values(c));const top=Object.keys(c).filter(k=>c[k]===max);
  const tally=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(k==='none'?t('noOne'):G.names[k])+': '+v).join(' · ');
  if(top.length>1)applyVerdict(null,'tie',tally);else if(top[0]==='none')applyVerdict(null,'skipped',tally);else applyVerdict(+top[0],'out',tally);}
function castVote(){
  G.ballots[G.order[G.i]]=G.sel;
  if(G.i<G.order.length-1){G.phase='ballotPass';G.i++;G.sel=null;save();
    $('app').innerHTML=stage(`<div class="big"><div class="orb">${IC.lock}</div><div class="res">${t('voted')}</div><p class="hint">${t('lockedHint')}</p><button class="btn ghost" onclick="render()">${t('done')}</button></div>`);return;}
  tallyVotes(G.ballots);
}
function applyVerdict(j,kind,tally){
  if(j!=null)G.alive[j]=false;
  G.hist.push(t('h_day',{d:G.day})+(j!=null?t('h_out',{n:G.names[j]}):t('h_none')));
  G.verdict={j,kind,tally};
  if(j!=null){G.ev=G.ev||{first:null,saves:[],caught:[]};(G.ev.outs=G.ev.outs||[]).push(j);}
  if(checkWin(j!=null?['v_vote_out',VOX.name(G.names[j])]:[]))return;
  NARR.verdict(j!=null?G.names[j]:null,j!=null&&S.rules.reveal?G.roles[j]:null,kind);
  go('verdict');
}
function verdictView(){
  const v=G.verdict;let body;
  if(!G.revealed)return suspense(IC.scale,'',t('deciding'));
  if(v.j!=null)body=`<div class="orb pop">${IC.scale}</div><div class="lbl">${t('outIs')}</div><div class="victim pop" style="color:var(--red2)">${nm(v.j)}</div>${S.rules.reveal?`<p class="hint" style="margin-bottom:6px">${t('wasRole',{r:t(G.roles[v.j])})}</p>`:''}`;
  else body=`<div class="orb">${IC.scale}</div><div class="res">${t(v.kind==='tie'?'tie':'skipped')}</div>`;
  if(v.tally)body+=`<p class="tally">${esc(v.tally)}</p>`;
  return stage(`<div class="big">${body}<div style="height:22px"></div><button class="btn primary" onclick="G.day++;startNight()">${t('nextNight',{d:G.day+1})}</button></div>`);
}
