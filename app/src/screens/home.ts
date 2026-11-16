/* ---------- home, history, stats ---------- */
function homeView(){const best=stats().best;
  return `${prefBtns()}<div class="hero"><div class="logo">${IC.logo}</div><h1>Mafia Dealer</h1><p>${t('tag')}</p></div>
  ${updBanner()}${resumeMpBtn()}${S.game?`<button class="btn gold" onclick="resumeGame()">${t('resumeGame')} <small>· ${t('round')} ${S.game.day}</small></button>
  <button class="link discard" onclick="ask(t('discardQ'),t('discardD'),t('discard'),discardGame)">${t('discard')}</button>`:''}
  <button class="mode primary" onclick="nav('setup')"><i class="mi">${IC.phone}</i><span><b>${t('newGame')}</b><small>${t('newGameSub')}</small></span></button>
  <button class="mode ghost" onclick="nav('mp')"><i class="mi">${IC.users}</i><span><b>${t('mpT')}</b><small>${t('mpSub')}</small></span></button>
  <div class="row3"><button onclick="nav('history')">${t('historyT')}<small>${LOG().length}${S.group?' · '+t('gTag'):''}</small></button><button onclick="nav('stats')">${t('statsT')}</button><button onclick="nav('guide')">${t('guideT')}</button></div>
  ${best?`<div class="crown">${IC.trophy}<span>${t('bestNow',{n:esc(best.name)})} · ${Math.round(best.r*100)}%</span></div>`:''}
  <button class="ver" onclick="checkNow()">v${APP.name} · ${t('checkUpd')}</button>`;}
const prefBtns=()=>`<div class="corner"><button class="ib acc" onclick="nav('account')" aria-label="${t('acctT')}" title="${t('acctT')}">${me()?avatarHtml(me().avatar,me().id,30):IC.user}</button><button class="ib" onclick="toggleLang()" aria-label="${t('lang')}" title="${t('lang')}">${IC.lang}</button><button class="ib" onclick="toggleTheme()" aria-label="${t('theme')}" title="${t('theme')}">${IC.theme}</button><button class="ib" onclick="nav('settings')" aria-label="${t('settingsT')}" title="${t('settingsT')}">${IC.gear}</button></div>`;
function toggleTheme(){S.theme=S.theme==='noir'?'neon':'noir';save();render();}
