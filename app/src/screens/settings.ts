/* ---------- app settings ---------- */
const BUZ=[0,1,2,3,5,10];
function settingsView(){
  const vol=(k,l)=>`<div class="tg vol"><div class="rt"><b>${l}</b></div><input type="range" min="0" max="100" step="5" value="${Math.round(S.vol[k]*100)}" aria-label="${l}"
    oninput="S.vol['${k}']=this.value/100;this.nextElementSibling.textContent=this.value+'%';persist()" onchange="volTest('${k}')"><span class="vv">${Math.round(S.vol[k]*100)}%</span></div>`;
  return head(t('settingsT'))
   +grp(IC.user,t('acctT'),me()?`<button class="tg wide" onclick="nav('account')">${avatarHtml(me().avatar,me().id,40)}<div class="rt"><b>${esc(me().display)}</b><span style="direction:ltr">@${esc(me().uname)}</span></div><span class="go">›</span></button>
     <div class="tg" onclick="S.hideOnline=!S.hideOnline;persist();render();inboxTick()"><div class="rt"><b>${t('fShowOn')}</b><span>${t('fShowOnD')}</span></div><div class="sw ${S.hideOnline?'':'on'}"></div></div>`
     :`<p class="mpinfo" style="margin:0 0 10px">${t('aWhy')}</p><button class="btn primary" onclick="nav('account')">${t('aIn')} / ${t('aUp')}</button>`)
   +grp(IC.theme,t('g_look'),`<div class="tg"><div class="rt"><b>${t('language')}</b></div>${seg([['en','English'],['ar','العربية']],S.lang,'setLang')}</div>
     <div class="tg"><div class="rt"><b>${t('theme')}</b></div>${seg([['neon',t('th_neon')],['noir',t('th_noir')]],S.theme==='noir'?'noir':'neon','setTheme')}</div>`)
   +grp(IC.sound,t('g_sound'),vol('voice',t('s_voice'))+vol('sfx',t('s_sfx')))
   +grp(IC.crown,t('g_host'),stepRow(t('h_buzz'),t('h_buzz_d'),S.host.buzzMax?S.host.buzzMax:t('off'),'buzStep')
     +`<div class="tg"><div class="rt"><b>${t('h_kick')}</b><span>${t('h_kick_d')}</span></div></div>${seg([['lobby',t('k_lobby')],['any',t('k_any')]],S.host.kick,'setKick')}`)
   +(typeof groupBlock==='function'?grp(IC.users,t('g_group'),groupBlock()):'')
   +grp(IC.eye,t('g_more'),`<div class="tg" onclick="S.welcome=S.welcome===false;persist();render()"><div class="rt"><b>${t('wlAtStart')}</b><span>${t('wlAtStartD')}</span></div><div class="sw ${S.welcome!==false?'on':''}"></div></div><button class="tg wide" onclick="showWelcome()"><div class="rt"><b>${t('wlReplay')}</b></div><span class="go">›</span></button><button class="tg wide" id="chk" onclick="checkNow()"><div class="rt"><b>${t('checkUpd')}</b><span>${S.latest&&S.latest.at?t('lastCheck',{v:esc(S.latest.name),d:fdate(S.latest.at)}):''}</span></div><span class="go">›</span></button><div class="tg"><div class="rt"><b>${t('version')}</b></div><span class="vv">v${APP.name}</span></div>`);}
function setLang(l){S.lang=l;persist();render();}
function setTheme(x){S.theme=x;persist();render();}
function setKick(k){S.host.kick=k;persist();render();}
function buzStep(d){const i=Math.max(0,Math.min(BUZ.length-1,BUZ.indexOf(S.host.buzzMax)+d));S.host.buzzMax=BUZ[i];persist();render();}
function volTest(k){SND.unlock();if(k==='voice')VOX.play(['n_player_1']);else SND.hit(false);}
