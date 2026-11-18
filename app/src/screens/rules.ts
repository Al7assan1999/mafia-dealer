function deckRules(n,err){const c=n-S.counts.mafia-S.counts.doctor-S.counts.detective;
  let h=`<div class="sec"><div class="sh"><h3>${t('deck')}</h3><span class="badge ${err?'bad':'ok'}">${n} ${t('players').toLowerCase()}</span></div>`;
  const m=S.counts.mafia,d=S.counts.detective,mUp=deckOk(n,m+1,m+1>=2?d:0),dUp=d<1&&deckOk(n,m,d+1);
  h+=roleRow('mafia',`<div class="step"><button ${m<=1?'disabled':''} onclick="cnt('mafia',-1)">−</button><i>${m}</i><button ${mUp?'':'disabled'} onclick="cnt('mafia',1)">+</button></div>`,mUp||n<4?'':t('maxMafia',{m:maxMafia(n),n}));
  h+=roleRow('doctor',`<div class="step"><span class="auto">${t('docOne')}</span><i>1</i></div>`);
  h+=roleRow('detective',S.counts.mafia>=2?`<div class="step"><button ${d<=0?'disabled':''} onclick="cnt('detective',-1)">−</button><i>${d}</i><button ${dUp?'':'disabled'} onclick="cnt('detective',1)">+</button></div>`
    :`<div class="step"><span class="auto">${t('detNeed2')}</span><i>0</i></div>`);
  h+=roleRow('citizen',`<div class="step"><span class="auto">${t('auto')}</span><i>${Math.max(c,0)}</i></div>`);
  const rm=recMafia(n);if(n>=4&&S.counts.mafia!==rm)h+=`<button class="rec" onclick="S.counts.mafia=${rm};fixCounts();persist();render()">${IC.crown}<span>${t('recM',{n:rm})}</span><b>${t('apply')}</b></button>`;
  h+=`</div>`+rulesCard();
  if(err)h+=`<p style="text-align:center;color:var(--red2);font-weight:700;font-size:14px;margin-bottom:8px">${err}</p>`;
  return h;}
const rulesChips=rs=>rs&&rs.length?`<div class="sec mt"><div class="sh"><h3>${t('hostRules')}</h3></div><div class="chips">${rs.map(k=>`<span class="chipb">${t('c_'+k)}</span>`).join('')}</div></div>`:'';
function rulesCard(){const on=activeRules();
  return `<button class="sec rsum" onclick="nav('rules')"><div class="sh"><h3>${t('rules')}</h3><span class="badge ok">${t('pre_'+presetOf())}</span></div>
   <div class="chips">${on.map(k=>`<span class="chipb">${t('c_'+k)}</span>`).join('')}<span class="chipb">${t('c_timer',{n:fmt(S.rules.timer)})}</span>${S.rules.nightT?`<span class="chipb">${t('c_nightT',{n:S.rules.nightT})}</span>`:''}</div><span class="go">${IC.fwd}</span></button>`;}
const grp=(icon: string,title: string,body: string,cls?: string)=>`<div class="sec rgrp ${cls||''}"><div class="sh"><h3><i class="gi">${icon}</i>${title}</h3></div>${body}</div>`;
const stepRow=(label,desc,val,fn)=>`<div class="tg"><div class="rt"><b>${label}</b>${desc?`<span>${desc}</span>`:''}</div><div class="step"><button onclick="${fn}(-1)">−</button><i style="min-width:52px;direction:ltr">${val}</i><button onclick="${fn}(1)">+</button></div></div>`;
const seg=(opts,cur,fn)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${cur===v?'on':''}" onclick="${fn}('${v}')">${l}</button>`).join('')}</div>`;
function rulesView(){const pr=presetOf();
  return head(t('rulesT'))+`<p class="mpinfo">${t('hostRulesNote')}</p><div class="preset">${['classic','beginner','custom'].map(p=>`<button class="${pr===p?'on':''}" ${p==='custom'?'disabled':''} onclick="setPreset('${p}')"><b>${t('pre_'+p)}</b><small>${t('pre_'+p+'_d')}</small></button>`).join('')}</div>`
   +grp(IC.moon,t('g_night'),tog('skip',t('r_skip'),t('r_skip_d'))+tog('norep',t('r_norep'),t('r_norep_d'))+tog('decoy',t('r_decoy'),t('r_decoy_d'))+tog('self',t('r_self'))+tog('rep',t('r_rep')))
   +grp(IC.sun,t('g_day'),tog('saverev',t('r_saverev'),t('r_saverev_d'))+tog('reveal',t('r_reveal'))+stepRow(t('r_timer'),'',fmt(S.rules.timer),'timStep')+tog('skipVote',t('r_skipVote'),t('r_skipVote_d')))
   +grp(IC.globe,t('g_multi'),stepRow(t('r_nightT'),t('r_nightT_d'),S.rules.nightT?S.rules.nightT+'s':t('off'),'ntStep')+tog('ghost',t('r_ghost'),t('r_ghost_d')));}
function timStep(d){tim(d*30);}
function ntStep(d){const i=Math.max(0,Math.min(NT.length-1,NT.indexOf(S.rules.nightT)+d));S.rules.nightT=NT[i];persist();render();}
