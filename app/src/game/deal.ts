/* deal */
function dealView(){
  const i=G.i,n=G.names.length;
  if(!G.revealed)return stage(`<div class="big"><div class="chip">${t('card')} ${i+1} ${t('of')} ${n}</div><div class="orb">${IC.phone}</div>
   <div class="lbl">${t('passTo')}</div><div class="who">${nm(i)}</div><p class="hint">${t('tiltHint')}</p>
   <button class="btn primary" onclick="G.revealed=true;render()">${t('iam',{n:nm(i)})}</button></div>`);
  const r=G.roles[i];
  let mates='';
  if(r==='mafia'){const m=G.roles.map((x,j)=>x==='mafia'&&j!==i?nm(j):null).filter(Boolean);if(m.length)mates=`<div class="mates">${t('mates',{n:m.join(S.lang==='ar'?'، ':', ')})}</div>`;}
  return stage(`<div class="big"><div class="lbl" style="margin-bottom:14px">${nm(i)} · ${t('yourRole')}</div>
   <div class="hold" id="hold"><div class="cover">${IC.eye}${t('holdHint')}</div>
   <div class="rv"><div class="ric" style="width:56px;height:56px;background:${RC[r]}1f;color:${RC[r]}">${IC[r]}</div><div class="rn" style="color:${RC[r]}">${t(r)}</div><div class="rd">${t('d_'+r)}</div>${mates}</div></div>
   <button class="btn ghost" id="memo" onclick="dealNext()" disabled style="opacity:.4">${i===n-1?t('memorizedLast'):t('memorized')}</button></div>`);
}
function bindHold(){
  const h=$('hold');if(!h)return;
  const on=e=>{e.preventDefault();h.classList.add('show');const m=$('memo');if(m){m.disabled=false;m.style.opacity='1';}};
  const off=()=>h.classList.remove('show');
  h.addEventListener('touchstart',on,{passive:false});h.addEventListener('mousedown',on);
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>h.addEventListener(ev,off));
  h.addEventListener('contextmenu',e=>e.preventDefault());
}
function dealNext(){if(G.i<G.names.length-1)go('deal',{i:G.i+1});else startNight();}
