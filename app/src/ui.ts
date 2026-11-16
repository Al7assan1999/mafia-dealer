const head=(title: string,right?: string)=>`<div class="top"><button class="pill" aria-label="back" onclick="back()">‹</button><div class="brand"><b>${title}</b></div>${right||''}</div>`;
const fdate=ts=>{try{return new Date(ts).toLocaleString(S.lang==='ar'?'ar':'en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return new Date(ts).toDateString();}};
let askFn: ()=>void=null;  // the confirm button of the open ask() sheet
function ask(title: string,desc: string,yes: string,fn: ()=>void){askFn=fn;$('modal').innerHTML=`<div class="modal" onclick="if(event.target===this)$('modal').innerHTML=''"><div class="sheet"><h3>${title}</h3><p>${desc}</p>
  <button class="btn ghost" onclick="$('modal').innerHTML=''">${t('cancel')}</button><button class="btn primary mt" onclick="$('modal').innerHTML='';askFn()">${yes}</button></div></div>`;}
let toastTimer: any;
function toast(msg: string){const e=$('toast');if(!e)return;e.textContent=msg;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2600);}
function copyText(x: string){let okk=false;try{if(window.Net&&Net.copy){Net.copy(x);okk=true;}}catch(e){}
  if(!okk){const ta=document.createElement('textarea');ta.value=x;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{okk=document.execCommand('copy');}catch(e){}ta.remove();}
  toast(t(okk?'copied':'copyFail'));}
const stage=(inner: string)=>`<div class="stage">${inner}</div>`;
