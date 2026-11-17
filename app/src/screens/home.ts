/* ---------- home, history, stats ---------- */
function homeView(){const best=stats().best;
  return `${prefBtns(true)}<div class="hero"><div class="logo">${IC.logo}</div><h1>Mafia Dealer</h1><p>${t('tag')}</p></div>
  ${updBanner()}${resumeMpBtn()}${S.game?`<button class="btn gold" onclick="resumeGame()">${t('resumeGame')} <small>· ${t('round')} ${S.game.day}</small></button>
  <button class="link discard" onclick="ask(t('discardQ'),t('discardD'),t('discard'),discardGame)">${t('discard')}</button>`:''}
  <button class="mode primary" id="mode-offline" onclick="nav('setup')"><i class="mi">${IC.phone}</i><span><b>${t('newGame')}</b><small>${t('newGameSub')}</small></span></button>
  <button class="mode ghost" id="mode-wifi" onclick="nav('wifi')"><i class="mi">${IC.wifi}</i><span><b>${t('modeWifi')}</b><small>${t('modeWifiSub')}</small></span></button>
  <button class="mode ghost" id="mode-online" onclick="nav('online')"><i class="mi">${IC.globe}</i><span><b>${t('modeOnline')}</b><small>${t('modeOnlineSub')}</small></span></button>
  <div class="row3"><button onclick="nav('history')">${t('historyT')}<small>${LOG().length}${S.group?' · '+t('gTag'):''}</small></button><button onclick="nav('stats')">${t('statsT')}</button><button onclick="nav('guide')">${t('guideT')}</button></div>
  ${best?`<div class="crown">${IC.trophy}<span>${t('bestNow',{n:esc(best.name)})} · ${Math.round(best.r*100)}%</span></div>`:''}
  <button class="ver" onclick="checkNow()">v${APP.name} · ${t('checkUpd')}</button>`;}
/** Profile (round, start side on Home) with a small menu; then the language flag, theme, settings. */
const pfBtn=()=>`<button class="ib acc pf" onclick="pfMenu()" aria-label="${t('acctT')}" title="${t('acctT')}">${me()?avatarHtml(me().avatar,me().id,40):IC.user}</button>`;
const prefBtns=(home?: boolean)=>(home?pfBtn():'')+`<div class="corner">${home?'':pfBtn()}<button class="ib flag" onclick="toggleLang()" aria-label="${t('lang')}" title="${t('lang')}">${S.lang==='ar'?'\u{1F1F8}\u{1F1E6}':'\u{1F1EC}\u{1F1E7}'}</button><button class="ib" onclick="toggleTheme()" aria-label="${t('theme')}" title="${t('theme')}">${IC.theme}</button><button class="ib" onclick="nav('settings')" aria-label="${t('settingsT')}" title="${t('settingsT')}">${IC.gear}</button></div>`;
function pfMenu(){const u=me();if(!u){nav('account');return;}const x="$('modal').innerHTML=''";
  $('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)${x}"><div class="sheet pfm"><div class="meline">${avatarHtml(u.avatar,u.id,48)}<div><b>${esc(u.display)}</b><small style="direction:ltr">@${esc(u.uname)}</small></div></div>
    <button class="btn primary mt" onclick="${x};nav('account')">${IC.user}${t('pfShow')}</button><button class="btn ghost mt" onclick="${x};signOut()">${t('aOut')}</button></div></div>`;}
function toggleTheme(){S.theme=S.theme==='noir'?'neon':'noir';save();render();}
