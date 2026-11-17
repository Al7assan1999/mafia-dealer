/* ---------- shell ---------- */
let lastRenderKey='';  // a new screen gets the fade-in animation
function render(){
  let h;
  if(!G)h=V==='setup'?setupView():V==='history'?historyView():V==='stats'?statsView():V==='guide'?guideView():V==='account'?accountView():V==='forgot'?forgotView():V==='profile'?profileView():V==='friends'?friendsView():V==='rules'?rulesView():V==='settings'?settingsView():V==='wifi'?wifiView():V==='online'?onlineView():V==='host'?hostView():V==='join'?joinView():V.indexOf('game:')===0?gameView(+V.slice(5)):homeView();
  else{
    const v={mpNight:mpNightView,mpVote:mpVoteView,deal:dealView,nightPass:nightPassView,nightAct:nightActView,nightDone:nightDoneView,dawn:dawnView,morning:morningView,day:dayView,ballotPass:ballotPassView,ballotAct:ballotActView,verdict:verdictView,end:endView}[G.phase];
    h=v();
    if(G.phase!=='end'&&!(['morning','verdict'].includes(G.phase)&&!G.revealed))h+=`<div class="footer">${t('round')} ${G.day} · ${aliveIdx().length}/${G.names.length} ${t('alive')}</div>`;
  }
  document.documentElement.dataset.theme=S.theme==='noir'?'noir':'neon';RC=RCS[S.theme==='noir'?'noir':'neon'];document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==='ar'?'rtl':'ltr';
  const ph=G?G.phase:'';let th='';
  if(['nightPass','nightAct','nightDone','dawn','mpNight'].includes(ph))th='night';else if(['day','ballotPass','ballotAct','mpVote'].includes(ph)||(ph==='morning'&&G.revealed&&G.morning==null)||(ph==='verdict'&&G.revealed&&G.verdict.j==null))th='day';
  else if((ph==='morning'||ph==='verdict')&&G.revealed)th='blood';else if(ph==='morning'||ph==='verdict')th=ph==='morning'?'day':'';
  else if(ph==='end'&&G.revealed)th=G.winner==='mafia'?'blood':'glory';
  document.body.className=th+(!G&&V==='home'?' home':'');
  if(G&&G.mp&&MP.role==='host'&&S.host.kick==='any'&&G.phase!=='end')h+=`<button class="pfab" onclick="playersSheet()" aria-label="${t('playersT')}">${IC.users}</button>`;
  const key=G?ph+'|'+G.i+'|'+G.day+'|'+G.revealed+'|'+G.mode+'|'+G.logId:'v:'+V;const app=$('app');
  app.classList.toggle('anim',key!==lastRenderKey);lastRenderKey=key;
  app.innerHTML=h;dockDraw();rbarDraw();
  if(G&&['morning','verdict','end'].includes(ph)&&!G.revealed&&!revealTimer)arm(1.5);
  if($('hold'))bindHold();
}
function showQuit(){
  $('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)keepPlaying()"><div class="sheet"><h3>${t('quitQ')}</h3><p>${t(G&&G.mp?'quitMp':'quitD')}</p>
  <button class="btn ghost" onclick="keepPlaying()">${t('keep')}</button><button class="btn primary mt" onclick="quitGame()">${t('quit')}</button></div></div>`;
}
function keepPlaying(){$('modal').innerHTML='';enterGame();}
function quitGame(){hush();$('modal').innerHTML='';if(G&&G.mp){stopTimer();G=null;hostBackRoom();V='host';render();return;}stopTimer();save();G=null;resumeOffer=!!S.game;V='home';render();}
{const J=lsGet(JNK);if(J&&(S.mpName||'').trim()&&(J.online||hasNet()))setTimeout(()=>{V='home';J.online?joinOnline(J.online.code):joinStart();},0);}
for(const m of Object.keys(NARR)){const f=NARR[m];NARR[m]=(...a)=>{f(...a);if(MP.role==='host'&&MP.online&&HN&&HN.bc)HN.bc({narr:m,a});};}
/* the welcome (v2.14): every start, unless switched off in Settings, or the app opens into something (a room it rejoins, an invite link);
   automated test browsers skip it */
if(S.wlSeen==null&&S.lastVer>=33)S.wlSeen=true;  // watched in v2.14: Skip from now on
const LINK0=(()=>{try{return (window.Net&&Net.link&&Net.link())||'';}catch(e){return '';}})();
if(S.welcome!==false&&!navigator.webdriver&&!LINK0&&!lsGet(JNK))showWelcome();
if(S.lastVer&&S.lastVer<APP.code)S.rnShow=APP.code;if(S.lastVer!==APP.code){S.lastVer=APP.code;save();}  // just updated: What's new once (v2.14)
setTimeout(()=>deepLink(LINK0),700);setTimeout(()=>checkUpdate(true).then(L=>{if(S.rnShow!==APP.code)return;S.rnShow=0;save();  // the update worked: its notes, or a line when offline
  const show=()=>{if(L&&L.history&&L.history.some(r=>r.code===APP.code)&&!G&&!MP.role&&!$('modal').innerHTML)whatsNew();else toast(t('updatedTo',{v:APP.name}));};
  if(WL.on)WL.after=show;else show();}),1500);  // after the welcomesetTimeout(acctRefresh,1800);setTimeout(gSync,2000);setTimeout(()=>{inboxTick();friendsLoad(true);},2500);  // every app start: version.json is a free static file
setInterval(inboxTick,10000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)inboxTick();});  // friends: invites, requests, online status
window.addEventListener('popstate',()=>{if(WL.on){if(WL.first){try{history.pushState({v:1},'');}catch(e){}return;}welcomeEnd();return;}if(chView){chClose();return;}if(S.fpanel&&dockShown()){dockOpen(false);return;}if(G){if(G.phase==='end'){finish();return;}showQuit();}else if(inRoom()){try{history.pushState({v:1},'');}catch(e){}askLeaveRoom();}else if(V!=='home')popNav();});
render();
