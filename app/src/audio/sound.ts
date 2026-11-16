/* ---------- sound engine (all procedural, no audio files) ---------- */
const SND=(()=>{
 let C=null,M=null,R=null,NB=null,E=null;
 function ac(){
  if(!C){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;C=new A();
   M=C.createGain();M.gain.value=0.9;const comp=C.createDynamicsCompressor();M.connect(comp);comp.connect(C.destination);
   E=C.createGain();E.connect(M);  // effects bus: S.vol.sfx
   R=C.createConvolver();R.buffer=impulse(3.2,2.4);const rg=C.createGain();rg.gain.value=0.55;R.connect(rg);rg.connect(E);}
  if(C.state==='suspended')C.resume();return C;}
 function impulse(sec,decay){const n=Math.floor(C.sampleRate*sec),b=C.createBuffer(2,n,C.sampleRate);
  for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;}
 function noise(){if(!NB){NB=C.createBuffer(1,C.sampleRate*2,C.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const s=C.createBufferSource();s.buffer=NB;s.loop=true;s.loopStart=Math.random();return s;}
 function out(node,wet){node.connect(E);if(wet){const g=C.createGain();g.gain.value=wet;node.connect(g);g.connect(R);}}
 function env(g,t,a,peak,hold,rel){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);
  g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(0.0001,t+a+hold+rel);}
 function osc(type,f,t,stop){const o=C.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(stop);return o;}
 function tone(type: OscillatorType,f: number,t: number,a: number,peak: number,rel: number,wet: number,filt?: number){const o=osc(type,f,t,t+a+rel+0.1),g=C.createGain();
  if(filt){const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filt;o.connect(lp);lp.connect(g);}else o.connect(g);
  env(g,t,a,peak,0,rel);out(g,wet);return o;}
 function burst(t,type,freq,q,peak,rel,wet){const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type=type;f.frequency.value=freq;f.Q.value=q;
  s.connect(f);f.connect(g);env(g,t,0.002,peak,0,rel);out(g,wet);s.start(t);s.stop(t+rel+0.05);}

 /* building blocks */
 function bell(t,f,vol){[[1,1,4],[2,.6,3],[2.4,.5,2.5],[3,.35,2],[4.2,.25,1.5],[5.4,.15,1]].forEach(([r,a,d])=>tone('sine',f*r,t,.005,vol*a,d,.9));}
 function drone(t,dur,f,vol){const lp=C.createBiquadFilter(),g=C.createGain();lp.type='lowpass';lp.Q.value=7;
  lp.frequency.setValueAtTime(120,t);lp.frequency.exponentialRampToValueAtTime(700,t+dur*.4);lp.frequency.exponentialRampToValueAtTime(140,t+dur);
  [[ 'sawtooth',f],['sawtooth',f*1.007],['sine',f/2],['sawtooth',f*1.498]].forEach(([ty,fr])=>osc(ty,fr,t,t+dur+.2).connect(lp));
  lp.connect(g);env(g,t,1.4,vol,Math.max(dur-3,.1),1.5);out(g,.5);}
 function whoosh(t,dur,f0,f1,vol){const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='bandpass';f.Q.value=2.5;
  f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);s.connect(f);f.connect(g);env(g,t,dur*.4,vol,0,dur*.6);out(g,.6);s.start(t);s.stop(t+dur+.1);}
 function growl(t,dur,vol){const sh=C.createWaveShaper(),curve=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;curve[i]=Math.tanh(9*x);}sh.curve=curve;
  const bp=C.createBiquadFilter(),g=C.createGain();bp.type='bandpass';bp.frequency.setValueAtTime(380,t);bp.frequency.linearRampToValueAtTime(260,t+dur);bp.Q.value=1.2;
  [62,93.5].forEach(fr=>{const o=osc('sawtooth',fr,t,t+dur+.2),l=osc('sine',6.5,t,t+dur+.2),lg=C.createGain();lg.gain.value=9;l.connect(lg);lg.connect(o.frequency);
   o.frequency.linearRampToValueAtTime(fr*.82,t+dur);o.connect(sh);});
  sh.connect(bp);bp.connect(g);env(g,t,.35,vol,dur-.9,.55);out(g,.7);}
 function chirp(t,f,len,vol){const o=osc('sine',f,t,t+len+.05),g=C.createGain();o.frequency.exponentialRampToValueAtTime(f*1.55,t+len*.55);
  o.frequency.exponentialRampToValueAtTime(f*1.05,t+len);o.connect(g);env(g,t,.006,vol,0,len);out(g,.35);}
 function whistle(t,f,vol){const o=osc('sine',f,t,t+.45),g=C.createGain();o.frequency.exponentialRampToValueAtTime(f*.66,t+.38);o.connect(g);env(g,t,.03,vol,.12,.25);out(g,.4);}
 function birds(t,dur){let x=t;while(x<t+dur){const n=2+Math.floor(Math.random()*4),f=2600+Math.random()*2200,sp=.07+Math.random()*.05;
   for(let k=0;k<n;k++)chirp(x+k*sp,f*(1+Math.random()*.08),.06+Math.random()*.04,.06+Math.random()*.06);
   if(Math.random()<.35)whistle(x+n*sp+.05,3000+Math.random()*900,.05);x+=.25+Math.random()*.45;}}
 function pad(t,dur,freqs,vol){freqs.forEach(f=>{const o=osc('triangle',f,t,t+dur+.2),g=C.createGain();o.connect(g);env(g,t,1.2,vol,Math.max(dur-2.7,.1),1.5);out(g,.6);});}
 function chimes(t,notes,vol){notes.forEach((f,i)=>{tone('triangle',f,t+i*.14,.008,vol,1.4,.5);tone('sine',f*2,t+i*.14,.008,vol*.3,.9,.5);});}
 function stinger(t){const o=osc('sine',70,t,t+2),g=C.createGain();o.frequency.exponentialRampToValueAtTime(28,t+1.2);o.connect(g);env(g,t,.01,.8,0,1.8);out(g,.4);
  [110,130.8,155.6,207.6].forEach(f=>tone('sawtooth',f,t,.02,.06,2.6,.7,900));burst(t,'lowpass',400,.7,.5,1.2,.6);}
 function gavel(t){const o=osc('sine',150,t,t+.4),g=C.createGain();o.frequency.exponentialRampToValueAtTime(55,t+.12);o.connect(g);env(g,t,.002,.8,0,.28);out(g,.25);
  burst(t,'bandpass',1300,1.2,.45,.09,.2);}
 function thunder(t,vol){const s=noise(),lp=C.createBiquadFilter(),g=C.createGain();lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(120,t+3);
  s.connect(lp);lp.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.06);
  for(let k=1;k<14;k++)g.gain.setValueAtTime(vol*(.3+Math.random()*.7)*Math.pow(1-k/14,1.5)+.001,t+k*.22);g.gain.exponentialRampToValueAtTime(.0001,t+3.8);
  out(g,.5);s.start(t);s.stop(t+4);burst(t,'highpass',2500,.5,.35,.25,.5);}
 function fanfare(t){const seq=[[392,0,.16],[523.3,.18,.16],[659.3,.36,.16],[784,.54,.6],[659.3,.92,.14],[784,1.08,1.4]];
  seq.forEach(([f,d,l])=>{(['sawtooth','square'] as OscillatorType[]).forEach((ty,i)=>tone(ty,f*(i?1.003:1),t+d,.03,i?.05:.09,l+.25,.4,2600));});
  [523.3,659.3,784,1046.5].forEach(f=>tone('sawtooth',f,t+1.08,.05,.04,2.2,.5,2200));}
 function crowd(t,dur,vol){[[1500,.7],[700,.9],[2600,1]].forEach(([fr,q])=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='bandpass';f.frequency.value=fr;f.Q.value=q;s.connect(f);f.connect(g);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.5);for(let x=t+.5;x<t+dur-1;x+=.12)g.gain.linearRampToValueAtTime(vol*(.55+Math.random()*.6),x);
   g.gain.exponentialRampToValueAtTime(.0001,t+dur);out(g,.4);s.start(t);s.stop(t+dur+.1);});}
 function claps(t,dur){const n=Math.floor(dur*28);for(let i=0;i<n;i++){const x=t+Math.random()*dur*(.4+.6*Math.random());burst(x,'bandpass',1600+Math.random()*900,1.4,.15+Math.random()*.3,.05,.3);}}
 function riffle(t){for(let i=0;i<22;i++)burst(t+i*.028+Math.random()*.01,'highpass',2200,.8,.25,.03,.1);}
 function alarm(t){[0,.35,.7].forEach(s=>tone('square',880,t+s,.01,.12,.28,.2,3000));}

 const on=()=>{if(!(S.vol.sfx>0)||!ac())return false;E.gain.value=S.vol.sfx;return true;};
 return{
  ctx:ac,out(){return M;},
  unlock(){ac();},
  shuffle(){if(!on())return;riffle(C.currentTime+.02);},
  night(){if(!on())return;const t=C.currentTime+.05;whoosh(t,2.2,2400,180,.35);drone(t,8,55,.22);bell(t+.3,110,.35);growl(t+1.1,2.2,.16);bell(t+2.6,103.8,.3);},
  morning(dead){if(!on())return;const t=C.currentTime+.05;birds(t,dead?3.2:4.2);pad(t,5,[261.6,329.6,392],.035);},
  hit(bad){if(!on())return;const t=C.currentTime+.02;if(bad)stinger(t);else chimes(t,[523.3,659.3,784,1046.5,1318.5],.13);},
  verdict(out){if(!on())return;const t=C.currentTime+.05;gavel(t);gavel(t+.32);gavel(t+.64);},
  mafiaWin(){if(!on())return;const t=C.currentTime+.05;thunder(t,.8);drone(t,9,49,.2);bell(t+.2,98,.35);thunder(t+4.5,.5);},
  citizensWin(){if(!on())return;const t=C.currentTime+.05;fanfare(t);crowd(t+.6,5.5,.22);claps(t+.8,5);chimes(t+2.6,[784,1046.5,1318.5,1568],.1);},
  timeUp(){if(!on())return;alarm(C.currentTime+.02);},
  dayStart(){if(!on())return;const t=C.currentTime+.05;gavel(t);}
 };
})();
