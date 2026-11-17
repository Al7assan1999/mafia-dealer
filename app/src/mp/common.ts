/* ---------- multiplayer, stage 1: connection test ---------- */
const PORT=8765;
const MP: Mp={role:null,players:{},seq:0,timer:null,status:'',lat:0,room:null,host:null,scanTok:0,pct:0,sig:''};
const hasNet=()=>!!(window.Net&&window.Net.put);
function myId(){let id=null;try{id=localStorage.getItem('mafiaDealer.id');}catch(e){}if(!id){id=Math.random().toString(36).slice(2,10);try{localStorage.setItem('mafiaDealer.id',id);}catch(e){}}return id;}
function parseIp(str){const [a,b]=String(str||'0,0').split(',').map(Number);const d=n=>n?[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255].join('.'):'';return{ip:d(a),gw:d(b)};}
function buzzFx(){try{navigator.vibrate&&navigator.vibrate([90,60,90]);}catch(e){}SND.unlock();SND.hit(false);const f=$('flash');if(f){f.classList.remove('go');void f.offsetWidth;f.classList.add('go');}}
const nameBox=()=>`<div class="sec"><div class="flbl" style="margin-top:0">${t('yourName')}</div>${me()?`<div class="meline">${avatarHtml(me().avatar,me().id,40)}<div><b>${esc(me().display)}</b><small>${t('fromProfile')}</small></div></div>`:`<input class="search" style="margin:0" maxlength="18" value="${esc(S.mpName||'')}" oninput="S.mpName=this.value;persist()"><p class="mpinfo" style="margin:8px 0 0">${t('aNameTip')}</p>`}</div>`;
function wifiView(){return head(t('modeWifi'))+nameBox()+`<p class="mpinfo">${t('mpInfo')}</p><div class="big2"><button class="btn primary" onclick="hostStart()">${t('host')}<small>${t('hostSub')}</small></button><button class="btn ghost" onclick="joinStart()">${t('join')}<small>${t('joinSub')}</small></button></div>`;}
function onlineView(){return head(t('modeOnline'))+`<p class="mpinfo">${t('onlineSub')}</p>
   <button class="btn primary" onclick="hostStart(true)">${t('hostOnline')}</button>
   <div class="sec mt"><div class="flbl" style="margin-top:0">${t('orJoin')}</div><div class="prow ojoin"><input id="ocode" class="search codein" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="000000" oninput="codeIn()" onkeydown="if(event.key==='Enter')codeGo()"><button class="btn primary" id="ojoin" disabled onclick="codeGo()">${t('joinOnline')}</button></div></div>`;}
/** The room code box keeps digits only (a pasted "123 456" becomes 123456); Join works at exactly 6. */
function codeIn(){const el=$('ocode') as HTMLInputElement,v=el.value.replace(/\D/g,'').slice(0,6);if(v!==el.value)el.value=v;($('ojoin') as any).disabled=v.length!==6;}
function codeGo(){const v=($('ocode') as HTMLInputElement).value;if(/^\d{6}$/.test(v))joinOnline(v);else toast(t('enterCode'));}
function needName(online?: boolean){if(online&&!me()){toast(t('needAcct'));nav('account');return true;}if(me())S.mpName=me().display;if(!(S.mpName||'').trim()){toast(t('needName'));return true;}if(!online&&!hasNet()){toast(t('mpNoNet'));return true;}return false;}
/* the host snapshots the room + game so a killed or restarted app can resume it */
const MPK='mafiaDealer.mp',JNK='mafiaDealer.join',FRESH=12*3600e3;
const keepOn=on=>{try{window.Net&&Net.keep&&Net.keep(on);}catch(e){}};
function lsGet(k){try{const s=JSON.parse(localStorage.getItem(k)||'null');return s&&Date.now()-s.at<FRESH?s:null;}catch(e){return null;}}
function lsSet(k,v){try{if(v)localStorage.setItem(k,JSON.stringify(Object.assign({at:Date.now()},v)));else localStorage.removeItem(k);}catch(e){}}
function mpSnap(){lsSet(MPK,MP.role==='host'&&MP.game?{seq:MP.seq,game:MP.game,G:G&&G.mp?G:null,players:MP.players,online:MP.online}:null);}
/* online: one WebSocket to the relay (one Durable Object per room code); same put/take/clear as the native Net */
const RELAY='wss://mafia-relay.mafiadealer.workers.dev';
const relayUrl=()=>(S.relay||RELAY).replace(/\/+$/,'');
const rnd=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');
let HN: HostNet=null;
const relayHttp=()=>relayUrl().replace(/^ws/,'http');
const roomKey=()=>MP.online?MP.online.code:(MP.role==='host'?MP.myIp:(MP.host&&MP.host.ip))||'';
const copyRow=()=>{const k=roomKey();return k?`<div class="copyrow"><span class="sel">${esc(k)}</span><button class="mini" onclick="copyText(roomKey())">${t('copy')}</button></div>`:'';};
function shareRoom(){const host=MP.role==='host'?S.mpName:(MP.host&&MP.host.name)||'',u=(S.latest&&S.latest.url)||relayUrl().replace(/^ws/,'http')+'/MafiaDealer.apk';
  const ip=MP.role==='host'?MP.myIp:(MP.host&&MP.host.ip);
  const txt=MP.online?t('shareTxt2',{c:MP.online.code}):ip?t('shareIpTxt2',{ip}):t('shareHotTxt2',{n:host});
  shareText(txt);}
/** The phone's share sheet (native bridge, then Web Share, then the clipboard). */
function shareText(txt: string){try{if(window.Net&&Net.share){Net.share(txt);return;}}catch(e){}
  if(navigator.share)navigator.share({text:txt}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast(t('copied')),()=>{});}
