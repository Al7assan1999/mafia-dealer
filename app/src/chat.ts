/* ---------- room chat (v2.10): Everyone + 1:1, through the host. Memory only: nothing is saved, it is gone when the room closes. ----------
 * Handles: 0 = the host, players get MP.players[id].cn (their private ids never leave the host). to -1 = Everyone.
 * In a game, out players reach only out players: their 1:1s to players still in are refused, their Everyone messages (d) only out players see.
 * Wi-Fi: the host adds my messages to my state (host phone memory). Online: sent live to my phone, never through the relay's stored state. */
interface ChatMsg { i: number; f: number; n: string; to: number; x: string; d?: number; k?: string }
let CH: ChatMsg[]=[];  // host: the whole room. player: what the host sends me
let chSeq=0,chMe=0;let chRate: Record<number,number[]>={},chSent: Record<string,string>={};
let chPend: {k: string; to: number; x: string; at: number; t0: number}[]=[];  // player: sent, not back from the host yet
let chView=false,chConv: number=null,chRead: Record<number,number>={};
let chStick=true,chLines='',chList='';  // at the newest message (then new ones keep it there); what is drawn now (redraw only on a change)
addEventListener('resize',()=>{if(chView&&chStick)chEnd();});  // the keyboard opened or closed  // chat open; the conversation (null = the list); last read per conversation
function chReset(){CH=[];chSeq=0;chMe=0;chRate={};chSent={};chPend=[];chRead={};chView=false;chConv=null;chList='';const el=$('chat');if(el)el.innerHTML='';}

/* host */
const chIdOf=(h: number)=>h===0?'host':Object.keys(MP.players).find(id=>MP.players[id].cn===h);
function chOut(h: number){if(!(G&&G.mp))return false;const id=chIdOf(h),i=id?G.ids.indexOf(id):-1;return i>=0&&!G.alive[i];}
function chHandles(){let n=0;for(const q of Object.values(MP.players))n=Math.max(n,q.cn||0);for(const q of Object.values(MP.players))if(!q.cn)q.cn=++n;}
/** A message into the room, checked here: the host decides, so a changed app can't get around the rules. */
function chPost(f: number,to: number,x: any,k?: string){x=String(x||'').trim().slice(0,200);to=+to;
  if(!x||to===f||(to!==-1&&chIdOf(to)==null))return false;
  if(k&&CH.some(m=>m.f===f&&m.k===k))return true;  // sent again: already here
  const out=chOut(f);if(out&&to!==-1&&!chOut(to))return false;
  const now=Date.now(),r=(chRate[f]||[]).filter(v=>now-v<10e3);if(r.length>=8)return false;r.push(now);chRate[f]=r;
  CH.push({i:++chSeq,f,n:f===0?S.mpName:MP.players[chIdOf(f)].name,to,x,d:out&&to===-1?1:undefined,k:k||undefined});if(CH.length>400)CH.splice(0,CH.length-400);return true;}
const chVis=(m: ChatMsg,h: number)=>m.f===h||m.to===h||m.to===-1&&(!m.d||chOut(h));
const chFor=(h: number)=>CH.filter(m=>chVis(m,h)).slice(-100).map(m=>m.f===h?m:Object.assign({},m,{k:undefined}));
/** Called by hostPublish for each player: the state carries my handle; Wi-Fi adds my messages, online sends them live when they change. */
function chPublish(id: string,st: Record<string,any>){const q=MP.players[id];if(!q||!q.cn||(q.v||0)<28)return;st.mc=q.cn;
  if(!MP.online){st.ch=chFor(q.cn);return;}
  const v=JSON.stringify(chFor(q.cn));if(chSent[id]!==v&&HN.to&&HN.to(id,{ch:JSON.parse(v)}))chSent[id]=v;}  // not sent (link down): the next publish tries again
function chHostIn(id: string,o: any){const q=MP.players[id];if(!q||!q.cn)return;if(o.t==='hello')delete chSent[id];  // reconnected: send it all again
  if(o.t==='chat'&&chPost(q.cn,o.to,o.x,String(o.k||'').slice(0,12))){hostPublish();chDraw();dockDraw();}}

/* player */
function chRecv(ch: ChatMsg[],mc?: number){if(mc)chMe=mc;if(!ch)return;const old=JSON.stringify(CH);CH=ch;
  chPend=chPend.filter(p=>!CH.some(m=>m.k===p.k));
  const top=CH.length?CH[CH.length-1].i:0;if(Object.values(chRead).some(v=>v>top))chRead={};  // the host restarted
  if(JSON.stringify(CH)!==old){chDraw();dockDraw();}}
function chResend(){const now=Date.now();chPend=chPend.filter(p=>now-p.t0<60e3);for(const p of chPend)if(now-p.at>3000){p.at=now;send({t:'chat',to:p.to,x:p.x,k:p.k});}}

/* both */
const chatShown=()=>MP.role==='host'?(V==='host'||!!(G&&G.mp)):MP.role==='client'&&V==='join'&&MP.status==='ok'&&!!(MP.room&&MP.room.cv);
const chMine=()=>MP.role==='host'?0:chMe;
const chMsgs=()=>MP.role==='host'?CH.filter(m=>chVis(m,0)):CH;
const chKey=(m: ChatMsg,h: number)=>m.to===-1?-1:m.f===h?m.to:m.f;
function chPeople(): RoomPlayer[]{if(MP.role==='host'){chHandles();return Object.values(MP.players).filter(q=>(q.v||0)>=28).map(q=>({name:q.name,on:q.on,uid:q.uid,av:q.uav,c:q.cn,out:chOut(q.cn)}));}
  return ((MP.room&&MP.room.players)||[]).filter(q=>q.c!=null&&q.c!==chMe);}
const chAmOut=()=>MP.role==='host'?chOut(0):!!((MP.room&&MP.room.players||[]).find(q=>q.c===chMe)||{} as any).out;
function chUnread(conv?: number){const h=chMine();return chMsgs().filter(m=>m.f!==h&&(conv==null||chKey(m,h)===conv)&&m.i>(chRead[chKey(m,h)]||0)).length;}

/* screens (#chat sits outside #app: room screens redraw under it) */
function chOpenList(){if(!chView){chView=true;try{history.pushState({v:1},'');}catch(e){}}chConv=null;chDraw();}  // phone Back closes it first
function chGo(c: number){chConv=c;chDraw();setTimeout(()=>{const i=$('chin');if(i)i.focus();},50);}
function chClose(){chView=false;chConv=null;chDraw();dockDraw();}
const chLine=(m: ChatMsg,h: number,names: boolean,pend?: boolean)=>{const mine=m.f===h;
  return `<div class="cm${mine?' me':''}${pend?' pend':''}">${names&&!mine?`<b>${esc(m.n)}${m.d?' · '+t('chatDeadTag'):''}</b>`:''}<span dir="auto">${esc(m.x)}</span></div>`;};
const chAv=(q: RoomPlayer)=>q.uid?avatarHtml(q.av,q.uid,34):`<span class="avt chx">${esc((q.name||'?').charAt(0).toUpperCase())}</span>`;
function chDraw(){const el=$('chat');if(!el)return;if(!chView){el.innerHTML='';chList='';return;}
  const h=chMine(),ms=chMsgs(),out=chAmOut(),c=chConv,ppl=chPeople();
  if(c==null){const last=(k: number)=>{const m=ms.filter(x=>chKey(x,h)===k).pop();return m?esc(m.x):'';};
    const row=(k: number,av: string,name: string,tag: string,plus: string)=>{const n=chUnread(k);
      return `<div class="prs"><button class="fl" onclick="chGo(${k})">${av}<div class="fn"><b>${name}${tag}</b><span>${last(k)||'&nbsp;'}</span></div></button>${n?`<span class="badge new">${n}</span>`:''}${plus}</div>`;};
    const rows=row(-1,`<span class="avt chx">${IC.chat}</span>`,t('chatAll'),'','')
      +ppl.map(q=>row(q.c,chAv(q),esc(q.name),q.out?` <small class="oldv">${t('chatDeadTag')}</small>`:'',plusBtn(q.uid))).join('');
    const html=`<div class="chw"><div class="chh"><b>${t('chatT')}</b><button class="ib" onclick="chClose()" aria-label="${t('cancel')}">✕</button></div>
      <div class="chb">${rows}${ms.length?'':`<p class="mpinfo" style="margin:10px 2px 0">${t('chatNone')}</p>`}</div></div>`;
    if(el.dataset.c===''&&html===chList)return;el.dataset.c='';chList=html;el.innerHTML=html;return;}
  const p=c===-1?null:ppl.find(q=>q.c===c),can=c===-1||!out||!!(p&&p.out);
  const mine=ms.filter(m=>chKey(m,h)===c),top=mine.length?mine[mine.length-1].i:0;
  if(top>(chRead[c]||0)){chRead[c]=top;setTimeout(dockDraw,0);}
  const lines=mine.map(m=>chLine(m,h,c===-1)).join('')+chPend.filter(x=>x.to===c).map(x=>chLine({i:0,f:h,n:'',to:c,x:x.x},h,false,true)).join('');
  const box=$('chm');
  if(box&&el.dataset.c===String(c)&&el.dataset.can===String(can)){if(lines!==chLines){chLines=lines;box.innerHTML=lines;if(chStick)chEnd();}return;}  // keep what is typed and where it is scrolled
  el.dataset.c=String(c);el.dataset.can=String(can);chLines=lines;chList='';
  el.innerHTML=`<div class="chw"><div class="chh"><button class="ib" onclick="chOpenList()" aria-label="back">‹</button><b>${c===-1?t('chatAll'):esc(p?p.name:(mine[0]&&mine[0].f===c?mine[0].n:''))}</b><button class="ib" onclick="chClose()" aria-label="${t('cancel')}">✕</button></div>
    <div class="chm" id="chm" onscroll="chStick=this.scrollHeight-this.scrollTop-this.clientHeight<40">${lines}</div>${out&&c===-1?`<p class="mpinfo" style="margin:6px 2px 0">${t('chatDeadOnly')}</p>`:''}
    ${can?`<div class="prow chf"><input id="chin" dir="auto" maxlength="200" autocomplete="off" enterkeyhint="send" placeholder="${t('chatPh')}" onkeydown="if(event.key==='Enter')chSend()" onfocus="setTimeout(chEnd,350)"><button class="pill" onmousedown="event.preventDefault()" onclick="chSend()">${t('chatSend')}</button></div>`
      :`<p class="mpinfo" style="margin:8px 2px 0">${t('chatDeadOnly')}</p>`}</div>`;
  chEnd();requestAnimationFrame(chEnd);setTimeout(chEnd,250);}  // again once the panel is laid out
/** The newest message in view (opening a conversation, sending, the keyboard opening). */
function chEnd(){const b=$('chm');if(b){b.scrollTop=b.scrollHeight;chStick=true;}}
function chSend(){const el=$('chin') as HTMLInputElement,x=el?el.value.trim().slice(0,200):'',c=chConv;if(!x||c==null)return;el.value='';el.focus();  // the keyboard stays open
  if(MP.role==='host'){if(chPost(0,c,x))hostPublish();else toast(t('chatSlow'));chDraw();chEnd();return;}
  const k=rnd(8),now=Date.now();chPend.push({k,to:c,x,at:now,t0:now});send({t:'chat',to:c,x,k});chDraw();chEnd();}
