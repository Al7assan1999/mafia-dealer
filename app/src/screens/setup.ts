function setupView(){
  const n=S.players.length,err=deckErr(n,S.players);
  let h=head(t('newGame'),prefBtns());
  h+=`<div class="sec"><div class="sh"><h3>${t('players')} (${n})</h3><button class="link" onclick="addPlayer()">${t('add')}</button></div>`;
  S.players.forEach((p,i)=>{h+=`<div class="prow"><div class="num">${i+1}</div><input value="${esc(p)}" maxlength="18" oninput="S.players[${i}]=this.value;persist()" onblur="fixName(${i})"><button class="x" aria-label="${t('remove')}" onclick="delPlayer(${i})">×</button></div>`;});
  if(me()&&!S.roster.some(n=>nkey(n)===nkey(me().display)))S.roster.unshift(me().display);
  const sv=S.roster.map((n,i)=>[n,i]).filter(([n])=>!S.players.some(p=>nkey(p)===nkey(n)));
  if(sv.length)h+=`<div class="flbl" style="margin-top:12px">${t('saved')}</div><div class="chips" style="margin:0">${sv.map(([n,i])=>`<button class="chipb" onclick="addSaved(${i})">+ ${esc(n)}</button>`).join('')}</div>`;
  h+=`</div>`+deckRules(n,err);
  h+=`<div class="cta"><button class="btn primary" ${err?'disabled':''} onclick="startGame()">${t('deal')}</button></div>`;
  return h;
}
const roleRow=(r,right)=>`<div class="role"><div class="ric" style="background:${RC[r]}1f;color:${RC[r]}">${IC[r]}</div><div class="rt"><b style="color:${RC[r]}">${t(r)}</b><span>${t('d_'+r)}</span></div>${right}</div>`;
const tog=(k: string,a: string,b?: string)=>`<div class="tg" onclick="flip('${k}')"><div class="rt"><b>${a}</b>${b?`<span>${b}</span>`:''}</div><div class="sw ${S.rules[k]?'on':''}"></div></div>`;
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function persist(){save();}
function addSaved(i){const n=S.roster[i];if(!n)return;const k=S.players.findIndex(isDefaultName);if(k>=0)S.players[k]=n;else if(S.players.length<20)S.players.push(n);persist();render();}
function fixName(i){if(!S.players[i].trim()){S.players[i]=t('pname')+' '+(i+1);render();}persist();}
function addPlayer(){if(S.players.length>=20)return;S.players.push(t('pname')+' '+(S.players.length+1));persist();render();setTimeout(()=>{const ins=document.querySelectorAll<HTMLInputElement>('.prow input');const l=ins[ins.length-1];if(l){l.focus();l.select();}},50);}
function delPlayer(i){const n=S.players[i];ask(t('rmQ',{n:esc(n)}),t('rmD'),t('remove'),()=>{S.players.splice(i,1);persist();render();});}
function cnt(r,d){S.counts[r]=(S.counts[r]|0)+d;fixCounts();persist();render();}
function flip(k){S.rules[k]=!S.rules[k];persist();render();}
function tim(d){S.rules.timer=Math.max(30,Math.min(900,S.rules.timer+d));timer.left=S.rules.timer;persist();render();}
function toggleLang(){S.lang=S.lang==='en'?'ar':'en';persist();render();}
