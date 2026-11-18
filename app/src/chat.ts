/* ---------- room chat (v2.10; v2.17 messenger look, reactions, replies, mentions; v2.18 sending status, edit): Everyone + 1:1, through the host. ----------
 * Memory only: nothing is saved, it is gone when the room closes.
 * Handles: 0 = the host, players get MP.players[id].cn (their private ids never leave the host). to -1 = Everyone.
 * In a game, out players reach only out players: their 1:1s to players still in are refused, their Everyone messages (d) only out players see,
 * they react only to messages only out players see, and mention only out players. The host checks everything.
 * Wi-Fi: the host adds my messages to my state (host phone memory). Online: sent live to my phone, never through the relay's stored state. */
interface ChatMsg { i: number; f: number; n: string; to: number; x: string; d?: number; k?: string; at?: number; re?: number; mt?: number[]; r?: Record<string,number[]>; e?: number; pk?: string; fail?: number }
const CH_RX=['\u{1F44D}','❤️','\u{1F602}','\u{1F62E}','\u{1F52A}','\u{1F92B}',  // 👍 ❤️ 😂 😮 🔪 (suspicious) 🤫 (lying): the quick six
  '😡','🤬','😢','😭','💔','🖕','🙏','🔥','💀','🤔','🙄','😱','🤡','👀','👏','😈','🥲','😴','🤝','💯','🎯','🐀','🕵️','🩸'];  // v2.19: behind + (🐀 = snitch)
const CH_RXQ=6,CH_RXV=40;  // quick ones on the bar; the host version that knows all of them
let CH: ChatMsg[]=[];  // host: the whole room. player: what the host sends me
let chSeq=0,chMe=0;let chRate: Record<number,number[]>={},chRxRate: Record<number,number[]>={},chSent: Record<string,string>={};
let chPend: {k: string; to: number; x: string; at: number; t0: number; re?: number; fail?: number}[]=[];  // player: sent, not back from the host yet (fail: not back in 8 s)
const CH_EDIT=15*60e3,CH_FAIL=8000;  // own messages can be edited for 15 minutes; a message not confirmed in 8 s shows Not sent
let chView=false,chConv: number=null,chRead: Record<number,number>={};  // chat open; the conversation (null = the list); last read per conversation
let chStick=true,chLines='',chList='';  // at the newest message (then new ones keep it there); what is drawn now (redraw only on a change)
let chReply=0,chActI=0,chMent: Record<number,boolean>={},chSeen=0;  // replying to; message whose actions are open; unread mentions of me; newest message seen
let chEditI=0,chSess='',chAnim='';  // message being edited; this room's chat (bell mentions open only while it lives); the next panel animation
addEventListener('resize',()=>{if(chView&&chStick)chEnd();});  // the keyboard opened or closed
function chReset(){CH=[];chSeq=0;chMe=0;chRate={};chRxRate={};chSent={};chPend=[];chRead={};chView=false;chConv=null;chList='';chReply=0;chActI=0;chMent={};chSeen=0;chEditI=0;chSess=rnd(6);const el=$('chat');if(el)el.innerHTML='';}

/* host */
const chIdOf=(h: number)=>h===0?'host':Object.keys(MP.players).find(id=>MP.players[id].cn===h);
function chOut(h: number){if(!(G&&G.mp))return false;const id=chIdOf(h),i=id?G.ids.indexOf(id):-1;return i>=0&&!G.alive[i];}
function chHandles(){let n=0;for(const q of Object.values(MP.players))n=Math.max(n,q.cn||0);for(const q of Object.values(MP.players))if(!q.cn)q.cn=++n;}
const chLimit=(R: Record<number,number[]>,f: number,max: number)=>{const now=Date.now(),r=(R[f]||[]).filter(v=>now-v<10e3);if(r.length>=max)return false;r.push(now);R[f]=r;return true;};
/** A message into the room, checked here: the host decides, so a changed app can't get around the rules. */
function chPost(f: number,to: number,x: any,k?: string,re?: any,mt?: any){x=String(x||'').trim().slice(0,200);to=+to;
  if(!x||to===f||(to!==-1&&chIdOf(to)==null))return false;
  if(k&&CH.some(m=>m.f===f&&m.k===k))return true;  // sent again: already here
  const out=chOut(f);if(out&&to!==-1&&!chOut(to))return false;
  if(!chLimit(chRate,f,8))return false;
  const r0=CH.find(m=>m.i===+re&&chVis(m,f));  // a reply: to a message the sender can see
  const mts=chMts(f,to,mt);
  const m: ChatMsg={i:++chSeq,f,n:f===0?S.mpName:MP.players[chIdOf(f)].name,to,x,d:out&&to===-1?1:undefined,k:k||undefined,at:Date.now(),re:r0?r0.i:undefined,mt:mts.length?mts:undefined};
  CH.push(m);if(CH.length>400)CH.splice(0,CH.length-400);
  if(mts.includes(0)&&f!==0)chMentioned([m]);  // the host itself was mentioned
  return true;}
/** Mentions: in the room, can see the message; out players mention only out players. */
function chMts(f: number,to: number,mt: any){const out=chOut(f),ok=(h: number)=>h!==f&&chIdOf(h)!=null&&(to===-1||h===to)&&(!out||chOut(h));
  return Array.isArray(mt)?[...new Set(mt.map(Number))].filter(ok).slice(0,8):[];}
/** Edit (v2.18): my own message, within 15 minutes of sending it (the host's clock decides). */
function chEditIn(h: number,i: any,x: any,mt?: any){const m=CH.find(v=>v.i===+i);x=String(x||'').trim().slice(0,200);
  if(!m||m.f!==h||!x||Date.now()-(m.at||0)>CH_EDIT||!chLimit(chRate,h,8))return false;if(m.x===x)return true;
  const mts=chMts(h,m.to,mt);m.x=x;m.e=1;m.mt=mts.length?mts:undefined;return true;}
/** A reaction (toggles). Out players react only to messages only out players see, so a reaction can't pass a hint. */
function chReactIn(h: number,i: any,e: any){const m=CH.find(x=>x.i===+i);e=+e;if(!m||!chVis(m,h)||!(Number.isInteger(e)&&e>=0&&e<CH_RX.length))return false;
  if(chOut(h)&&!(m.d||m.to!==-1&&chOut(m.f)&&chOut(m.to)))return false;
  if(!chLimit(chRxRate,h,20))return false;
  const r=m.r||(m.r={}),L=r[e]||(r[e]=[]),j=L.indexOf(h);if(j>=0)L.splice(j,1);else L.push(h);if(!L.length)delete r[e];if(!Object.keys(r).length)delete m.r;return true;}
const chVis=(m: ChatMsg,h: number)=>m.f===h||m.to===h||m.to===-1&&(!m.d||chOut(h));
const chFor=(h: number)=>CH.filter(m=>chVis(m,h)).slice(-100).map(m=>m.f===h?m:Object.assign({},m,{k:undefined}));
/** Called by hostPublish for each player: the state carries my handle; Wi-Fi adds my messages, online sends them live when they change. */
function chPublish(id: string,st: Record<string,any>){const q=MP.players[id];if(!q||!q.cn||(q.v||0)<28)return;st.mc=q.cn;
  if(!MP.online){st.ch=chFor(q.cn);return;}
  const v=JSON.stringify(chFor(q.cn));if(chSent[id]!==v&&HN.to&&HN.to(id,{ch:JSON.parse(v)}))chSent[id]=v;}  // not sent (link down): the next publish tries again
function chHostIn(id: string,o: any){const q=MP.players[id];if(!q||!q.cn)return;if(o.t==='hello')delete chSent[id];  // reconnected: send it all again
  if(o.t==='chat'&&chPost(q.cn,o.to,o.x,String(o.k||'').slice(0,12),o.re,o.mt)||o.t==='react'&&chReactIn(q.cn,o.i,o.e)||o.t==='edit'&&chEditIn(q.cn,o.i,o.x,o.mt)){hostPublish();chDraw();dockDraw();}}

/* player */
function chRecv(ch: ChatMsg[],mc?: number){if(mc)chMe=mc;if(!ch)return;const old=JSON.stringify(CH);CH=ch;
  chPend=chPend.filter(p=>!CH.some(m=>m.k===p.k));
  const top=CH.length?CH[CH.length-1].i:0;if(Object.values(chRead).some(v=>v>top)){chRead={};chSeen=0;}  // the host restarted
  const fresh=CH.filter(m=>m.i>chSeen);chSeen=Math.max(chSeen,top);chMentioned(fresh);
  if(JSON.stringify(CH)!==old){chDraw();dockDraw();}}
/** Not back from the host yet: sent again every 3 s; after 8 s it shows "Not sent · Tap to retry" (runs on every client tick, connected or not). */
function chResend(){const now=Date.now();let fl=false;
  for(const p of chPend){if(now-p.t0>=CH_FAIL){if(!p.fail){p.fail=1;fl=true;}continue;}if(MP.status==='ok'&&now-p.at>3000){p.at=now;chSendP(p);}}
  if(fl)chDraw();}
const chSendP=(p: typeof chPend[0])=>send({t:'chat',to:p.to,x:p.x,k:p.k,re:p.re,mt:chFindMentions(p.x,p.to)});
function chRetry(k: string){const p=chPend.find(x=>x.k===k);if(!p)return;p.t0=p.at=Date.now();p.fail=0;if(MP.status==='ok')chSendP(p);chDraw();}
/** New messages that mention me: a buzz (once), and an @ on the chat button until I read them. */
function chMentioned(ms: ChatMsg[]){const me=chMine();let any=false;for(const m of ms)if(m.mt&&m.mt.includes(me)&&m.f!==me&&!(chView&&chConv===chKey(m,me))){chMent[m.i]=true;any=true;nMention(m,chKey(m,me));}
  if(any){buzzFx();dockDraw();}}
/** A mention in the bell (v2.18): Open while this room's chat lives, then read-only. */
function nMention(m: ChatMsg,conv: number){const q=chWho(m.f);const from={id:(q&&q.uid)||'',display:m.n,avatar:(q&&q.av)||''} as Friend;
  nSave(L=>{const key='ment:'+chSess+':'+m.i;if(L.some(n=>n.key===key))return false;L.push({key,k:'ment',id:m.i,from,at:Date.now(),st:'',x:m.x.slice(0,80),conv,sess:chSess});return true;});}
const nMentLive=(n: NLog)=>!!MP.role&&!!chSess&&n.sess===chSess;
function chOpenAt(conv: number,i: number){if(!MP.role)return;chOpenList();chGo(conv);setTimeout(()=>chJump(i),350);}

/* both */
const chatShown=()=>MP.role==='host'?(V==='host'||!!(G&&G.mp)||roomMinned()):MP.role==='client'&&(V==='join'||roomMinned())&&MP.status==='ok'&&!!(MP.room&&MP.room.cv);
const chMine=()=>MP.role==='host'?0:chMe;
const chMsgs=()=>MP.role==='host'?CH.filter(m=>chVis(m,0)):CH;
const chKey=(m: ChatMsg,h: number)=>m.to===-1?-1:m.f===h?m.to:m.f;
function chPeople(): RoomPlayer[]{if(MP.role==='host'){chHandles();return Object.values(MP.players).filter(q=>(q.v||0)>=28).map(q=>({name:q.name,on:q.on,uid:q.uid,av:q.uav,c:q.cn,out:chOut(q.cn)}));}
  return ((MP.room&&MP.room.players)||[]).filter(q=>q.c!=null&&q.c!==chMe);}
const chAmOut=()=>MP.role==='host'?chOut(0):!!((MP.room&&MP.room.players||[]).find(q=>q.c===chMe)||{} as any).out;
const chMeP=(): RoomPlayer=>({name:S.mpName,on:true,uid:me()?me().id:null,av:me()?me().avatar:'',c:chMine(),out:chAmOut()});
const chWho=(h: number)=>h===chMine()?chMeP():chPeople().find(q=>q.c===h);
function chUnread(conv?: number){const h=chMine();return chMsgs().filter(m=>m.f!==h&&(conv==null||chKey(m,h)===conv)&&m.i>(chRead[chKey(m,h)]||0)).length;}
const chMentN=(conv?: number)=>{const h=chMine();return chMsgs().filter(m=>chMent[m.i]&&(conv==null||chKey(m,h)===conv)).length;};
/** Who I may @mention in a conversation: the people there (the other person in a 1:1); when I'm out, only out players. */
function chCanMention(conv: number){const out=chAmOut();return chPeople().filter(q=>(conv===-1||q.c===conv)&&(!out||q.out));}
function chFindMentions(x: string,conv: number){const lx=x.toLowerCase();return chCanMention(conv).filter(q=>lx.includes('@'+q.name.toLowerCase())).map(q=>q.c);}

/* screens (#chat sits outside #app: room screens redraw under it) */
function chOpenList(){if(!chView){chView=true;chAnim='up';try{history.pushState({v:1},'');}catch(e){}}chConv=null;chReply=0;chActI=0;chEditI=0;chDraw();}  // phone Back closes it first
function chGo(c: number){chConv=c;chReply=0;chActI=0;chEditI=0;chAnim=chAnim||'in';try{history.pushState({v:1},'');}catch(e){}chDraw();setTimeout(()=>{const i=$('chin');if(i)i.focus();},50);}
function chClose(){chView=false;chConv=null;chReply=0;chActI=0;chEditI=0;chDraw();dockDraw();}
/** Phone Back / the Back button: a conversation goes back to the list, the list back to the room. */
function chBack(){if(chConv!=null){chConv=null;chReply=0;chActI=0;chEditI=0;chAnim='back';chDraw();}else chClose();}
const chCalm=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return true;}};
/** The panel's entrance (opened, a conversation in, back to the list); used once, on the next full draw. */
const chIn=()=>{const a=chAnim;chAnim='';return a&&!chCalm()?' a-'+a:'';};
const chAv=(q: RoomPlayer,size=34)=>q&&q.uid?avatarHtml(q.av,q.uid,size):`<span class="avt chx" style="width:${size}px;height:${size}px">${esc(((q&&q.name)||'?').charAt(0).toUpperCase())}</span>`;
const chTime=(at?: number)=>{if(!at)return '';try{return new Date(at).toLocaleTimeString(S.lang==='ar'?'ar':'en-GB',{hour:'2-digit',minute:'2-digit'});}catch(e){return '';}};
/** The text with @mentions highlighted (mine stand out). */
function chText(m: ChatMsg){let h=esc(m.x);for(const c of m.mt||[]){const q=chWho(c);if(!q)continue;const nm=esc('@'+q.name);
  h=h.replace(new RegExp(nm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),s=>`<b class="ment${c===chMine()?' me':''}">${s}</b>`);}return h;}
function chQuote(re: number){const o=chMsgs().find(m=>m.i===re);
  return `<button class="rq" onclick="event.stopPropagation();chJump(${re})"><b>${o?esc(o.n):''}</b><span dir="auto">${o?esc(o.x):t('chatOld')}</span></button>`;}
function chRx(m: ChatMsg){const me=chMine(),r=m.r||{};const ks=Object.keys(r).filter(e=>r[e]&&r[e].length);if(!ks.length)return '';
  return `<div class="rxs">${ks.map(e=>`<button class="rx${r[e].includes(me)?' on':''}" onclick="chReact(${m.i},${e})">${CH_RX[+e]} ${r[e].length}</button>`).join('')}</div>`;}
const CH_CLK='<svg class="cst" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.2 1.6"/></svg>';
const CH_OK='<svg class="cst" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>';
function chLinesHtml(list: ChatMsg[],h: number,group: boolean){return list.map((m,j)=>{const mine=m.f===h,pend=!m.i,prev=list[j-1],next=list[j+1];
  const first=!prev||prev.f!==m.f,last=!next||next.f!==m.f;
  const av=mine?'':`<span class="cav">${last?chAv(chWho(m.f)||{name:m.n} as RoomPlayer,28):''}</span>`;
  const name=group&&first&&!mine?`<b class="cnm">${esc(m.n)}${m.d?' · '+t('chatDeadTag'):''}</b>`:'';
  const acts=pend?'':`onpointerdown="chPress(event,${m.i})" oncontextmenu="event.preventDefault();chActs(${m.i})"`;
  const meta=[m.e?t('chatEdited'):'',last&&m.at?chTime(m.at):''].filter(Boolean).join(' · ')+(mine&&last&&!m.fail?(pend?CH_CLK:CH_OK):'');  // sending: a clock; delivered: a tick
  const fail=m.fail?`<button class="cfail" onclick="chRetry('${m.pk}')">${t('chatFail')}</button>`:'';
  return `<div class="cmr${mine?' me':''}${last?' last':''}${chMent[m.i]?' hit':''}${m.fail?' nsent':''}" data-i="${m.i||''}">${av}<div class="cmc"><div class="cm${pend?' pend':''}" ${acts}>${name}${m.re?chQuote(m.re):''}<span dir="auto">${chText(m)}</span>${meta?`<time>${meta}</time>`:''}</div>${chRx(m)}${fail}</div></div>`;}).join('');}
function chDraw(){scrollLock();const el=$('chat');if(!el)return;
  if(!chView){chList='';chAnim='';const w=el.querySelector('.chw');if(!w||chCalm()){el.innerHTML='';return;}  // minimized: slides down, then goes
    w.classList.add('a-down');setTimeout(()=>{if(!chView)el.innerHTML='';},200);return;}
  const h=chMine(),ms=chMsgs(),out=chAmOut(),c=chConv,ppl=chPeople();
  const minBtn=`<button class="ib" onclick="chClose()" aria-label="${t('chatMin')}" title="${t('chatMin')}">${IC.minimize}</button>`;
  if(c==null){const lastOf=(k: number)=>ms.filter(x=>chKey(x,h)===k).pop();
    const row=(k: number,av: string,name: string,tag: string,plus: string)=>{const L=lastOf(k),n=chUnread(k),at=chMentN(k);
      const prev=L?(k===-1&&L.f!==h?esc(L.n)+': ':L.f===h?t('chatYou')+': ':'')+esc(L.x):t('chatEmpty');
      return `<div class="chr${n?' unread':''}"><button class="fl" onclick="chGo(${k})">${av}<div class="fn"><div class="t1"><b>${name}${tag}</b><time>${L?chTime(L.at):''}</time></div>
        <div class="t2"><span dir="auto">${prev}</span>${at?'<i class="atb">@</i>':''}${n?`<i class="unb">${n}</i>`:''}</div></div></button>${plus}</div>`;};
    const rows=row(-1,`<span class="avt chx grp">${IC.users}</span>`,t('chatAll'),'','')
      +ppl.map(q=>row(q.c,chAv(q,44),esc(q.name),q.out?` <small class="oldv">${t('chatDeadTag')}</small>`:'',plusBtn(q.uid))).join('');
    const html=`<div class="chh"><button class="ib" onclick="chBack()" aria-label="${t('chatBack')}">${IC.back}</button><b>${t('chatT')}</b>${minBtn}</div>
      <div class="chb">${rows}<p class="mpinfo chnote">${t(ms.length?'chatGone':'chatNone')}</p></div>`;
    const w=el.querySelector('.chw');if(el.dataset.c===''&&w&&!w.classList.contains('a-down')&&!chAnim){if(html!==chList){chList=html;w.innerHTML=html;}return;}  // a new message: only the rows change, no flash
    el.dataset.c='';chList=html;el.innerHTML=`<div class="chw${chIn()}">${html}</div>`;return;}
  const p=c===-1?null:ppl.find(q=>q.c===c),can=c===-1||!out||!!(p&&p.out);
  const mine=ms.filter(m=>chKey(m,h)===c),top=mine.length?mine[mine.length-1].i:0;
  let rd=false;if(top>(chRead[c]||0)){chRead[c]=top;rd=true;}for(const m of mine)if(chMent[m.i]){delete chMent[m.i];rd=true;}if(rd)setTimeout(dockDraw,0);
  const lines=chLinesHtml([...mine,...chPend.filter(x=>x.to===c).map(x=>({i:0,f:h,n:'',to:c,x:x.x,re:x.re,at:x.t0,pk:x.k,fail:x.fail}) as ChatMsg)],h,c===-1);
  const box=$('chm');
  if(box&&el.dataset.c===String(c)&&el.dataset.can===String(can)&&!el.querySelector('.chw.a-down')&&!chAnim){if(lines!==chLines){chLines=lines;box.innerHTML=lines;if(chStick)chEnd();}return;}  // keep what is typed and where it is scrolled
  el.dataset.c=String(c);el.dataset.can=String(can);chLines=lines;chList='';
  const title=c===-1?`<span class="avt chx grp" style="width:34px;height:34px">${IC.users}</span><div><b>${t('chatAll')}</b><small>${t('chatPeopleN',{n:ppl.length+1})}</small></div>`
    :`${chAv(p||{name:''} as RoomPlayer,34)}<div><b>${esc(p?p.name:(mine[0]&&mine[0].f===c?mine[0].n:''))}</b>${p&&p.out?`<small>${t('chatDeadTag')}</small>`:''}</div>`;
  el.innerHTML=`<div class="chw${chIn()}"><div class="chh"><button class="ib" onclick="chBack()" aria-label="${t('chatBack')}">${IC.back}</button><div class="cht">${title}</div>${minBtn}</div>
    <div class="chm" id="chm" onscroll="chStick=this.scrollHeight-this.scrollTop-this.clientHeight<40">${lines}</div>${out&&c===-1?`<p class="mpinfo" style="margin:6px 2px 0">${t('chatDeadOnly')}</p>`:''}
    <div id="chmen"></div><div id="chrep"></div>
    ${can?`<div class="chf"><input id="chin" dir="auto" maxlength="200" autocomplete="off" enterkeyhint="send" placeholder="${t('chatPh')}" onkeydown="if(event.key==='Enter')chSend()" oninput="chMentDraw()" onfocus="setTimeout(chEnd,350)">
      <button class="chsend" onmousedown="event.preventDefault()" onclick="chSend()" aria-label="${t('chatSend')}">${IC.send}</button></div>`
      :`<p class="mpinfo" style="margin:8px 2px 0">${t('chatDeadOnly')}</p>`}<div id="chact"></div></div>`;
  chRepDraw();chEnd();requestAnimationFrame(chEnd);setTimeout(chEnd,250);}  // again once the panel is laid out
/** The newest message in view (opening a conversation, sending, the keyboard opening). */
function chEnd(){const b=$('chm');if(b){b.scrollTop=b.scrollHeight;chStick=true;}}
function chSend(){const el=$('chin') as HTMLInputElement,x=el?el.value.trim().slice(0,200):'',c=chConv;if(!x||c==null)return;el.value='';el.focus();  // the keyboard stays open
  const re=chReply||undefined,mt=chFindMentions(x,c);chReply=0;
  if(chEditI){const i=chEditI;chEditI=0;chRepDraw();chMentDraw();
    if(MP.role==='host'){if(chEditIn(0,i,x,mt))hostPublish();else toast(t('chatEditLate'));chDraw();return;}
    const m=CH.find(v=>v.i===i);if(m&&m.x!==x){m.x=x;m.e=1;}send({t:'edit',i,x,mt});chDraw();return;}  // shown now; the host's copy wins
  chRepDraw();chMentDraw();
  if(MP.role==='host'){if(chPost(0,c,x,undefined,re,mt))hostPublish();else toast(t('chatSlow'));chDraw();chEnd();return;}
  const k=rnd(8),now=Date.now();chPend.push({k,to:c,x,at:now,t0:now,re});send({t:'chat',to:c,x,k,re,mt});chDraw();chEnd();}
/* long-press a message: reactions and Reply */
let chPressT: any=0;
const CH_SW=60;  // swipe this far to reply
/** Long-press (450 ms, held still): reactions, Reply, Edit. Swipe right (left in Arabic) past 60 px: Reply, on any message (v2.19, like Telegram).
 *  The bubble follows the finger with a reply icon behind it; an upward / downward move is left to scrolling (.cm has touch-action: pan-y). */
function chPress(e: PointerEvent,i: number){clearTimeout(chPressT);const x0=e.clientX,y0=e.clientY,sg=document.documentElement.dir==='rtl'?-1:1;
  const row=(e.currentTarget as HTMLElement).closest('.cmr') as HTMLElement;let sw=false,armed=false,ic: HTMLElement=null;
  const done=(ok: boolean)=>{clearTimeout(chPressT);removeEventListener('pointerup',up);removeEventListener('pointercancel',no);removeEventListener('pointermove',mv);
    if(!sw)return;row.style.transition='transform .18s ease';row.style.transform='';setTimeout(()=>{row.style.transition='';if(ic)ic.remove();},200);if(ok&&armed)chReplyStart(i);};
  const up=()=>done(true),no=()=>done(false);
  const mv=(ev: PointerEvent)=>{const dx=(ev.clientX-x0)*sg,dy=Math.abs(ev.clientY-y0);
    if(!sw){if(dy>10&&dy>=Math.abs(dx)||dx<-12){done(false);return;}  // scrolling, or the other way
      if(Math.abs(dx)+dy>10)clearTimeout(chPressT);  // moving: no long-press
      if(dx>12&&dx>dy*1.5){sw=true;ic=document.createElement('i');ic.className='swr';ic.innerHTML=IC.reply;row.prepend(ic);}
      return;}
    const d=Math.max(0,Math.min(dx,90));row.style.transform=`translateX(${d*sg}px)`;ic.style.opacity=String(Math.min(1,d/CH_SW));
    if(!armed&&d>=CH_SW){armed=true;ic.classList.add('on');try{navigator.vibrate&&navigator.vibrate(10);}catch(err){}}else if(armed&&d<CH_SW){armed=false;ic.classList.remove('on');}};
  addEventListener('pointerup',up);addEventListener('pointercancel',no);addEventListener('pointermove',mv);
  chPressT=setTimeout(()=>{done(false);chActs(i);},450);}
function chCanAct(i: number){const m=chMsgs().find(x=>x.i===i);if(!m)return false;const me=chMine();
  return !chAmOut()||!!(m.d||m.to!==-1&&chWho(m.f)&&chWho(m.to)&&(m.f===me?chWho(m.to).out:chWho(m.f).out));}
/** Edit is offered on my own messages for 15 minutes, when the host's app knows edits (v2.18+). */
function chCanEdit(i: number){const m=chMsgs().find(x=>x.i===i);return !!m&&m.f===chMine()&&Date.now()-(m.at||0)<CH_EDIT-20e3&&(MP.role==='host'||((MP.room&&MP.room.hv)||0)>=37);}
/** Long-press (v2.18, like Messenger): the message lifts in place over a dimmed chat, reactions just above it, Reply / Edit just below. */
function chActs(i: number){chActI=i;const el=$('chact');if(!el)return;if(!i){el.innerHTML='';return;}
  const row=document.querySelector(`#chm .cmr[data-i="${i}"]`) as HTMLElement,b=row&&row.querySelector('.cm') as HTMLElement;if(!b)return;
  try{navigator.vibrate&&navigator.vibrate(15);}catch(e){}
  const rx=chCanAct(i),ed=chCanEdit(i),r=b.getBoundingClientRect(),W=innerWidth,H=innerHeight;
  const menu=`<div class="chmenu"><button onclick="chReplyStart(${i})">${IC.reply}<span>${t('chatReply')}</span></button>${ed?`<button onclick="chEditStart(${i})">${IC.edit}<span>${t('chatEdit')}</span></button>`:''}</div>`;
  const right=r.left+r.width/2>W/2;  // hangs from the side the message is on
  const side=right?`right:${Math.max(8,W-r.right)}px;align-items:flex-end`:`left:${Math.max(8,r.left)}px;align-items:flex-start`;
  el.innerHTML=`<div class="chact" onclick="if(event.target===this)chActs(0)"><div class="chpop" style="top:0;${side}">
    ${rx?`<div class="rxp">${chRxBtns(i,CH_RXQ)}${chRxMoreOk()?`<button class="rxm" onclick="chRxMore(${i})" aria-label="${t('chatMoreRx')}">${IC.plus}</button>`:''}</div>`:''}
    <div class="${row.className.replace(/\b(last|hit|flash)\b/g,'')} chlift"><div class="cm" style="width:${r.width}px">${b.innerHTML}</div></div>${menu}</div></div>`;
  chPopR=r.top;chPlace();}
let chPopR=0;  // where the long-pressed message is on screen
/** The message where it was; the whole menu stays on screen (offsets ignore the pop-in scale). */
function chPlace(){const pop=document.querySelector('#chact .chpop') as HTMLElement,lift=pop&&pop.querySelector('.chlift') as HTMLElement;if(!lift)return;
  pop.style.top=Math.max(12,Math.min(chPopR-lift.offsetTop,innerHeight-pop.offsetHeight-12))+'px';}
const chRxBtns=(i: number,n: number)=>CH_RX.slice(0,n).map((x,e)=>`<button onclick="chReact(${i},${e})" aria-label="${x}">${x}</button>`).join('');
const chRxMoreOk=()=>MP.role==='host'||((MP.room&&MP.room.hv)||0)>=CH_RXV;
/** +: the bar grows into the grid of all reactions, in place (v2.19). */
function chRxMore(i: number){const b=document.querySelector('#chact .rxp') as HTMLElement;if(!b)return;b.classList.add('all');b.innerHTML=chRxBtns(i,CH_RX.length);chPlace();}
function chReact(i: number,e: number){chActs(0);if(MP.role==='host'){if(chReactIn(0,i,e)){hostPublish();chDraw();}return;}send({t:'react',i,e});}
function chReplyStart(i: number){chActs(0);chEditI=0;chReply=i;chRepDraw();const n=$('chin');if(n)n.focus();}
function chEditStart(i: number){const m=chMsgs().find(x=>x.i===i);chActs(0);if(!m)return;chReply=0;chEditI=i;chRepDraw();
  const n=$('chin') as HTMLInputElement;if(n){n.value=m.x;n.focus();n.setSelectionRange(m.x.length,m.x.length);}}
function chEditStop(){chEditI=0;const n=$('chin') as HTMLInputElement;if(n)n.value='';chRepDraw();chMentDraw();}
function chRepDraw(){const el=$('chrep');if(!el)return;
  const e=chEditI&&chMsgs().find(m=>m.i===chEditI);if(e){el.innerHTML=`<div class="crp ed"><div><b>${t('chatEditing')}</b><span dir="auto">${esc(e.x)}</span></div><button class="ib" onclick="chEditStop()" aria-label="${t('cancel')}">✕</button></div>`;return;}
  const o=chReply&&chMsgs().find(m=>m.i===chReply);
  el.innerHTML=o?`<div class="crp"><div><b>${t('chatReplyTo',{n:esc(o.n)})}</b><span dir="auto">${esc(o.x)}</span></div><button class="ib" onclick="chReply=0;chRepDraw()" aria-label="${t('cancel')}">✕</button></div>`:'';}
function chJump(i: number){const r=document.querySelector(`#chm .cmr[data-i="${i}"]`) as HTMLElement;if(!r)return;r.scrollIntoView({block:'center',behavior:'smooth'});r.classList.remove('flash');void r.offsetWidth;r.classList.add('flash');}
/* @mentions: typing @ lists the people I can mention here */
function chMentDraw(){const el=$('chmen'),inp=$('chin') as HTMLInputElement;if(!el)return;if(!inp||chConv==null){el.innerHTML='';return;}
  const m=/@([^\s@]{0,18})$/.exec(inp.value.slice(0,inp.selectionStart||inp.value.length));
  const L=m?chCanMention(chConv).filter(q=>q.name.toLowerCase().startsWith(m[1].toLowerCase())).slice(0,6):[];
  el.innerHTML=L.length?`<div class="chmn">${L.map(q=>`<button onmousedown="event.preventDefault()" onclick="chMentPick(${q.c})">${chAv(q,26)}<b>${esc(q.name)}</b></button>`).join('')}</div>`:'';}
function chMentPick(c: number){const inp=$('chin') as HTMLInputElement,q=chWho(c);if(!inp||!q)return;const pos=inp.selectionStart||inp.value.length;
  const before=inp.value.slice(0,pos).replace(/@([^\s@]{0,18})$/,'@'+q.name+' ');inp.value=before+inp.value.slice(pos);inp.focus();inp.setSelectionRange(before.length,before.length);chMentDraw();}
