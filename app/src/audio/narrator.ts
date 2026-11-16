/* ---------- narrator (pre-recorded clips in audio.js) ---------- */
const VOX=(()=>{let tok=0,live=[];const cache={};
 function buf(k){const C=SND.ctx();if(!C||!k||!CLIPS[k])return Promise.resolve(null);if(cache[k])return Promise.resolve(cache[k]);
  const bin=atob(CLIPS[k]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  return new Promise(r=>{try{C.decodeAudioData(u.buffer,x=>{cache[k]=x;r(x);},()=>r(null));}catch(e){r(null);}});}
 function stop(){tok++;live.forEach(x=>{try{x.stop();}catch(e){}});live=[];}
 function play(keys: string[],delay?: number,cb?: (marks: number[])=>void){stop();if(!(S.vol.voice>0))return;const C=SND.ctx();if(!C)return;const my=tok,t0=C.currentTime+(delay||0);
  Promise.all(keys.map(buf)).then(bs=>{if(my!==tok)return;let t=Math.max(t0,C.currentTime+.05);
   const marks=[];
   bs.forEach(x=>{marks.push(t-C.currentTime);if(!x)return;const s=C.createBufferSource(),g=C.createGain();g.gain.value=1.7*S.vol.voice;s.buffer=x;s.connect(g);g.connect(SND.out());s.start(t);live.push(s);t+=x.duration;});marks.push(t-C.currentTime);if(cb)cb(marks);});}
 function norm(n){return String(n).toLowerCase().trim().replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[-'’.]/g,'').replace(/\s+/g,' ');}
 function name(n: string,mon?: number){const k=norm(n),c=NAME_ALIAS[k]||NAME_ALIAS[k.split(' ')[0]]||null;if(!c||!mon)return c;const m='m_'+c.slice(2);return CLIPS[m]?m:c;}  // mon: monster voice
 return{play,stop,name};})();
function hush(){VOX.stop();}
let revealTimer: any=null;
function arm(sec){clearTimeout(revealTimer);revealTimer=setTimeout(revealNow,Math.max(sec,0)*1000);}
function revealNow(){clearTimeout(revealTimer);revealTimer=null;if(!G||G.revealed||!['morning','verdict','end'].includes(G.phase))return;
  G.revealed=true;if(G.mp)hostPublish();const bad=(G.phase==='morning'&&G.morning!=null)||(G.phase==='verdict'&&G.verdict.j!=null)||(G.phase==='end'&&G.winner==='mafia');
  try{navigator.vibrate&&navigator.vibrate(bad?[120,80,350]:60);}catch(e){}
  if(G.phase==='morning')SND.hit(G.morning!=null);else if(G.phase==='verdict'&&G.verdict.j!=null)SND.hit(true);save();render();}
const NARR={
  welcome(){SND.shuffle();VOX.play(['v_welcome'],.8);},
  night(){SND.night();VOX.play([pick1(['v_night_1','v_night_2','v_night_3','v_night_4','v_night_5'])],2.4);},
  morning(dead,role,saved){SND.morning(dead!=null);arm(dead!=null?3.6:4.4);
    if(dead!=null)VOX.play([pick1(['v_killed_1','v_killed_2','v_killed_3']),VOX.name(dead,1),role&&'v_was_'+role],2.8,m=>arm(m[1]-.15));
    else if(saved!=null)VOX.play([pick1(['v_saved_1','v_saved_2']),VOX.name(saved)],3.4,m=>arm(m[1]-.15));
    else VOX.play([pick1(['v_safe_1','v_safe_2','v_safe_3'])],3.4,m=>arm(m[0]+1.2));},
  day(){SND.dayStart();VOX.play([pick1(['v_day','v_day_2'])],.4);},
  verdict(name,role,kind){SND.verdict(name!=null);arm(1.4);
    if(name!=null)VOX.play([pick1(['v_vote_out','v_vote_out_2']),VOX.name(name),role&&'v_was_'+role],1.3,m=>arm(m[1]-.15));
    else VOX.play([kind==='tie'?'v_vote_tie':'v_vote_none'],1.2,m=>arm(m[0]+.6));},
  timeUp(){SND.timeUp();VOX.play(['v_timeup'],1.1);},
  mafiaWin(names,lead){lead=lead||[];if(lead.length)SND.verdict(true);else SND.mafiaWin();arm(2);
    VOX.play([...lead,'v_laugh','v_mafia_win',...names.map(n=>VOX.name(n,1))],1.5,m=>{if(lead.length)setTimeout(()=>SND.mafiaWin(),Math.max(m[lead.length]-.4,0)*1000);arm(m[lead.length]+.3);});},
  citizensWin(names,lead){lead=lead||[];if(lead.length)SND.verdict(true);arm(lead.length?6:2.4);
    const fan=()=>SND.citizensWin();if(!lead.length)fan();else if(!(S.vol.voice>0))setTimeout(fan,2000);
    VOX.play([...lead,'v_citizens_win',...names.map(n=>VOX.name(n))],lead.length?1.4:2.2,m=>{if(lead.length)setTimeout(fan,Math.max(m[lead.length]-.3,0)*1000);arm(m[lead.length]+.2);});}
};
function pick1(a){return a[Math.floor(Math.random()*a.length)];}
