/* Welcome sounds (prototype): every sound is made with Web Audio, except the evil laugh (our recorded clip).
 * makeKit(ctx, master) -> {bus(dest), S: {good:{A,B,C}, night:{A,B,C}, crack, kill:{A,B,C}, doc:{A,B,C}, det:{A,B,C}, maf:{A,B,C}}, loadLaugh(b64)}
 * Each sound is a function (t) that schedules itself at time t on the current bus. Works with AudioContext and OfflineAudioContext. */
function makeKit(C,master){
 let BUS=master,NB=null,LAUGH=null;
 const imp=(sec,decay)=>{const n=Math.floor(C.sampleRate*sec),b=C.createBuffer(2,n,C.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;};
 const R=C.createConvolver();R.buffer=imp(3,2.6);const rg=C.createGain();rg.gain.value=.45;R.connect(rg);rg.connect(master);
 const noise=()=>{if(!NB){NB=C.createBuffer(1,C.sampleRate*2,C.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const s=C.createBufferSource();s.buffer=NB;s.loop=true;s.loopStart=Math.random();return s;};
 const out=(node,wet)=>{node.connect(BUS);if(wet){const g=C.createGain();g.gain.value=wet;node.connect(g);g.connect(R);}};
 const env=(g,t,a,peak,hold,rel)=>{g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(.0001,t+a+hold+rel);};
 const osc=(type,f,t,stop)=>{const o=C.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(stop);return o;};
 const tone=(type,f,t,a,peak,rel,wet,filt,hold=0)=>{const o=osc(type,f,t,t+a+hold+rel+.1),g=C.createGain();
   if(filt){const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filt;o.connect(lp);lp.connect(g);}else o.connect(g);env(g,t,a,peak,hold,rel);out(g,wet);return o;};
 const burst=(t,type,freq,q,peak,rel,wet)=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type=type;f.frequency.value=freq;f.Q.value=q;s.connect(f);f.connect(g);env(g,t,.002,peak,0,rel);out(g,wet);s.start(t);s.stop(t+rel+.05);};
 const bed=(t,dur,type,freq,q,vol,wet,att=.6)=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type=type;f.frequency.value=freq;f.Q.value=q;s.connect(f);f.connect(g);env(g,t,att,vol,Math.max(dur-att-.8,.05),.8);out(g,wet);s.start(t);s.stop(t+dur+.1);return f;};
 const bell=(t,f,vol)=>[[1,1,4],[2,.6,3],[2.4,.5,2.5],[3,.35,2],[4.2,.25,1.5],[5.4,.15,1]].forEach(([r,a,d])=>tone('sine',f*r,t,.005,vol*a,d,.9));
 const pad=(t,dur,fs,vol)=>fs.forEach(f=>{const o=osc('triangle',f,t,t+dur+.2),g=C.createGain();o.connect(g);env(g,t,1,vol,Math.max(dur-2.2,.1),1.2);out(g,.6);});
 const whoosh=(t,dur,f0,f1,vol)=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='bandpass';f.Q.value=2.5;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
   s.connect(f);f.connect(g);env(g,t,dur*.4,vol,0,dur*.6);out(g,.6);s.start(t);s.stop(t+dur+.1);};
 const chirp=(t,f,len,vol)=>{const o=osc('sine',f,t,t+len+.05),g=C.createGain();o.frequency.exponentialRampToValueAtTime(f*1.55,t+len*.55);o.frequency.exponentialRampToValueAtTime(f*1.05,t+len);o.connect(g);env(g,t,.006,vol,0,len);out(g,.35);};
 const birds=(t,dur,v=1)=>{let x=t;while(x<t+dur){const n=2+Math.floor(Math.random()*4),f=2600+Math.random()*2200,sp=.07+Math.random()*.05;
   for(let k=0;k<n;k++)chirp(x+k*sp,f*(1+Math.random()*.08),.06+Math.random()*.04,(.06+Math.random()*.06)*v);x+=.3+Math.random()*.45;}};
 const vib=(o,t,stop,rate,depth)=>{const l=osc('sine',rate,t,stop),lg=C.createGain();lg.gain.value=depth;l.connect(lg);lg.connect(o.frequency);};
 const drone=(t,dur,f,vol)=>{const lp=C.createBiquadFilter(),g=C.createGain();lp.type='lowpass';lp.Q.value=6;lp.frequency.setValueAtTime(120,t);lp.frequency.exponentialRampToValueAtTime(600,t+dur*.45);lp.frequency.exponentialRampToValueAtTime(150,t+dur);
   [['sawtooth',f],['sawtooth',f*1.008],['sine',f/2],['sawtooth',f*1.498]].forEach(([ty,fr])=>osc(ty,fr,t,t+dur+.3).connect(lp));lp.connect(g);env(g,t,1,vol,Math.max(dur-2.4,.1),1.4);out(g,.5);};
 const beat=(t,vol)=>{[[0,60,1],[.17,50,.7]].forEach(([d,f,k])=>{const o=osc('sine',f,t+d,t+d+.4),g=C.createGain();o.frequency.exponentialRampToValueAtTime(f*.7,t+d+.14);o.connect(g);env(g,t+d,.008,vol*k,0,.22);out(g,.15);});burst(t,'lowpass',160,.5,vol*.25,.09,.1);};

 /* 1 the happy town */
 const mbox=(t,f,v=.09)=>{tone('sine',f,t,.003,v,1.3,.5);tone('sine',f*2,t,.003,v*.3,.6,.5);tone('sine',f*3.01,t,.003,v*.12,.3,.4);};
 const pluck=(t,f,v=.13)=>{const o1=osc('sawtooth',f,t,t+1.6),o2=osc('triangle',f*1.002,t,t+1.6),lp=C.createBiquadFilter(),g=C.createGain();lp.type='lowpass';lp.Q.value=2;
   lp.frequency.setValueAtTime(3200,t);lp.frequency.exponentialRampToValueAtTime(260,t+.5);o1.connect(lp);o2.connect(lp);lp.connect(g);env(g,t,.004,v,0,1.4);out(g,.35);};
 const good={
  A:t=>{birds(t,3.4);pad(t,3.6,[261.63,329.63,392,493.88],.028);tone('sine',1046.5,t+.4,.8,.016,2,.9);},
  B:t=>{[1046.5,1318.5,1568,1760,1568,1318.5,1046.5,1174.66,1318.5].forEach((f,i)=>mbox(t+i*.3,f));birds(t+.6,2.6,.6);},
  C:t=>{[130.81,196,261.63,329.63,392,329.63,261.63,196,261.63].forEach((f,i)=>pluck(t+i*.26,f));bed(t,3.6,'bandpass',500,.6,.025,.3,1.2);}};
 /* 2 night falls (then the crack) */
 const crickets=(t,dur,v=.05)=>{for(let x=t;x<t+dur;x+=.42+Math.random()*.12){const o=osc('sine',4300+Math.random()*300,x,x+.2),g=C.createGain();o.connect(g);g.gain.setValueAtTime(.0001,x);
   for(let k=0;k<3;k++){g.gain.setValueAtTime(v,x+k*.05);g.gain.setValueAtTime(.0001,x+k*.05+.025);}out(g,.2);}};
 const hoo=(t,len,v)=>{const o=osc('sine',380,t,t+len+.1),g=C.createGain();o.frequency.exponentialRampToValueAtTime(330,t+len);vib(o,t,t+len+.1,5,6);
   const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;o.connect(lp);lp.connect(g);env(g,t,.08,v,len*.3,len*.6);out(g,.7);};
 const owl=t=>{hoo(t,.4,.1);hoo(t+.6,.18,.08);hoo(t+.85,.42,.1);};
 const howl=t=>{const o=osc('sine',520,t,t+2.4),g=C.createGain(),lp=C.createBiquadFilter();o.frequency.exponentialRampToValueAtTime(760,t+.6);o.frequency.exponentialRampToValueAtTime(430,t+2.2);
   vib(o,t,t+2.4,5,9);lp.type='lowpass';lp.frequency.value=1100;o.connect(lp);lp.connect(g);env(g,t,.5,.05,.8,1);out(g,.9);};
 const wind=(t,dur)=>{const f=bed(t,dur,'bandpass',650,4,.09,.4,1);const l=osc('sine',.3,t,t+dur),lg=C.createGain();lg.gain.value=350;l.connect(lg);lg.connect(f.frequency);};
 const night={
  A:t=>{crickets(t,3.8);owl(t+.4);bell(t+.2,110,.22);},
  B:t=>{whoosh(t,2.2,2400,180,.3);drone(t,4,55,.18);bell(t+.3,110,.28);},
  C:t=>{wind(t,3.8);bell(t+.3,98,.22);bell(t+2.4,98,.18);howl(t+.9);}};
 const crack=t=>{burst(t,'highpass',1800,.7,.9,.09,.6);const o=osc('sine',140,t,t+.4),g=C.createGain();o.frequency.exponentialRampToValueAtTime(38,t+.25);o.connect(g);env(g,t,.002,.9,0,.3);out(g,.4);
   burst(t,'lowpass',320,.5,.5,.5,.5);burst(t+.24,'highpass',1500,.7,.22,.08,.9);};
 /* 3 the killing */
 const shing=t=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='highpass';f.frequency.setValueAtTime(1500,t);f.frequency.exponentialRampToValueAtTime(7000,t+.3);
   s.connect(f);f.connect(g);env(g,t,.12,.35,.05,.3);out(g,.4);s.start(t);s.stop(t+.6);[2380,3571,5123,6211].forEach((fr,i)=>tone('sine',fr,t+.22,.003,.09/(i+1)*1.5,1.4-i*.2,.6));};
 const stab=t=>{const o=osc('sine',95,t,t+.5),g=C.createGain();o.frequency.exponentialRampToValueAtTime(38,t+.18);o.connect(g);env(g,t,.002,.9,0,.35);out(g,.25);
   burst(t,'lowpass',700,.8,.6,.12,.2);burst(t+.01,'bandpass',450,3,.35,.2,.2);};
 const sting=t=>{const o=osc('sine',70,t,t+2),g=C.createGain();o.frequency.exponentialRampToValueAtTime(28,t+1.2);o.connect(g);env(g,t,.01,.6,0,1.6);out(g,.4);
   [110,130.8,155.6,207.6].forEach(f=>tone('sawtooth',f,t,.02,.045,2.4,.7,900));};
 /* instruments for scenes 3-5 (v2 of the board: the mood is shock, warmth, resolve) */
 const strings=(t,dur,fs,vol,cut=1400,att=.7)=>fs.forEach(f=>[0,-6,6].forEach(c=>{const o=osc('sawtooth',f*Math.pow(2,c/1200),t,t+dur+1.4),lp=C.createBiquadFilter(),g=C.createGain();
   vib(o,t,t+dur+1.4,5,f*.004);lp.type='lowpass';lp.frequency.value=cut;o.connect(lp);lp.connect(g);env(g,t,att,vol,Math.max(dur-att,.05),1.2);out(g,.6);}));
 const piano=(t,f,v=.12,len=1.8)=>{tone('triangle',f,t,.004,v,len,.45);tone('sine',f*2,t,.004,v*.35,len*.6,.45);tone('sine',f*3,t,.003,v*.12,len*.3,.4);burst(t,'bandpass',f*4,2,v*.15,.02,.1);};
 const boom=(t,v=.9)=>{const o=osc('sine',55,t,t+2.2),g=C.createGain();o.frequency.exponentialRampToValueAtTime(30,t+1.6);o.connect(g);env(g,t,.005,v,0,2);out(g,.5);burst(t,'lowpass',180,.6,v*.5,1.4,.6);};
 const brass=(t,f,len,v=.07)=>{const o=osc('sawtooth',f,t,t+len+.4),lp=C.createBiquadFilter(),g=C.createGain();vib(o,t+.15,t+len+.4,5.5,f*.006);lp.type='lowpass';lp.Q.value=1.5;
   lp.frequency.setValueAtTime(300,t);lp.frequency.exponentialRampToValueAtTime(1800,t+.12);lp.frequency.exponentialRampToValueAtTime(900,t+len);o.connect(lp);lp.connect(g);env(g,t,.05,v,Math.max(len-.15,.02),.3);out(g,.5);};
 const gasp=t=>{[[900,3,.14],[1300,4,.1],[2400,5,.05]].forEach(([fr,q,v])=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='bandpass';f.frequency.setValueAtTime(fr*.8,t);f.frequency.linearRampToValueAtTime(fr*1.15,t+.25);f.Q.value=q;
   s.connect(f);f.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+.08);g.gain.exponentialRampToValueAtTime(v*.5,t+.3);g.gain.exponentialRampToValueAtTime(.0001,t+1.2);out(g,.6);s.start(t);s.stop(t+1.3);});};
 const tremolo=(t,dur,f,v)=>{const o=osc('sawtooth',f,t,t+dur+.3),lp=C.createBiquadFilter(),g=C.createGain(),am=osc('sine',11,t,t+dur+.3),ag=C.createGain();ag.gain.value=v*.5;am.connect(ag);
   lp.type='lowpass';lp.frequency.value=2500;o.connect(lp);lp.connect(g);ag.connect(g.gain);env(g,t,dur*.7,v,dur*.2,.4);out(g,.6);};
 const celesta=(t,f,v=.09)=>{tone('sine',f,t,.002,v,1.2,.6);tone('sine',f*4,t,.002,v*.25,.4,.6);tone('sine',f*2,t,.002,v*.2,.7,.6);};
 const dbass=(t,f)=>{tone('triangle',f,t,.005,.22,.45,.15,600);tone('sine',f,t,.005,.18,.5,.1);burst(t,'lowpass',300,1,.06,.03,.05);};
 const brush=t=>burst(t,'highpass',6000,.6,.05,.09,.15);
 /* 3 the killing: a knife, then shock and dread */
 /* the bell and the lament after the hit (3C) */
 const lament=t=>{bell(t,73.42,.3);bell(t+1.75,73.42,.22);[[110,0],[130.81,.55],[164.81,1.1],[146.83,1.65],[130.81,2.3]].forEach(([f,d])=>piano(t+.45+d,f,.14,2.2));};
 /* the sword: a swing that sweeps past the ear with the blade's thin whistle, a steel ring (a bar's uneven overtones), a scrape out of the sheath, the cut */
 const sweep=(t,len,q,f0,fpk,f1,v,wet)=>{const s=noise(),bp=C.createBiquadFilter(),g=C.createGain();bp.type='bandpass';bp.Q.value=q;
   bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(fpk,t+len*.45);bp.frequency.exponentialRampToValueAtTime(f1,t+len);
   s.connect(bp);bp.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+len*.45);g.gain.exponentialRampToValueAtTime(.0001,t+len);out(g,wet);s.start(t);s.stop(t+len+.05);};
 const swish=(t,len,f0,fpk,f1,v)=>{sweep(t,len,2.5,f0,fpk,f1,v,.25);sweep(t,len,16,fpk*.55,fpk*1.15,fpk*.6,v*.9,.3);};
 const ring=(t,f0,v,dur=1.6)=>[[1,1],[2.76,.6],[5.4,.35],[8.93,.2]].forEach(([r,a],i)=>[0,3.5].forEach(dt=>tone('sine',f0*r+dt,t,.002,v*a*.5,dur*(1-i*.18),.6)));
 const scrape=(t,dur,v)=>{for(let x=t;x<t+dur;x+=.006+Math.random()*.006)burst(x,'highpass',2500+((x-t)/dur)*4500,.8,v*(.4+Math.random()*.6),.012,.2);};
 const cut=(t,v=1)=>{burst(t,'highpass',3000,.7,v*.6,.025,.3);burst(t,'bandpass',1800,1.2,v*.45,.12,.2);sweep(t,.2,2,2600,2200,650,v*.35,.2);
   const o=osc('sine',90,t,t+.5),g=C.createGain();o.frequency.exponentialRampToValueAtTime(40,t+.2);o.connect(g);env(g,t,.002,v*.7,0,.3);out(g,.25);};
 /* the blade, louder and metallic: a scrape through steel resonances that slide up as the blade leaves the sheath,
    then a bright SHING (a dozen high uneven overtones, each in a slightly detuned pair so it shimmers), then the hit */
 const STEEL=[2210,3120,4390,5660,7130,8790,10420];
 const scrapeM=(t,dur,v)=>{const s=noise(),am=C.createGain(),sum=C.createGain();sum.gain.value=v*2.4;s.connect(am);
   am.gain.setValueAtTime(0,t);for(let x=t;x<t+dur;x+=.004)am.gain.setValueAtTime((.25+Math.random()*.75)*(.5+.5*(x-t)/dur),x);am.gain.setValueAtTime(0,t+dur);
   STEEL.forEach((f,i)=>{const bp=C.createBiquadFilter();bp.type='bandpass';bp.Q.value=24;bp.frequency.setValueAtTime(f*.93,t);bp.frequency.linearRampToValueAtTime(f*1.04,t+dur);am.connect(bp);bp.connect(sum);});
   const hp=C.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800;sum.connect(hp);out(hp,.35);s.start(t);s.stop(t+dur+.05);};
 const shingM=(t,v,dur=1.8)=>{const P=[2633,3517,4142,5288,6011,6950,7804,8611,9478,10305,11240,12190];
   P.forEach((f,i)=>[0,f*.0021].forEach(dt=>tone('sine',f+dt,t,.0015,v*(i<4?.16:.1)/(1+i*.12),dur*(1-i*.05),.55)));
   burst(t,'highpass',5000,.7,v*.55,.35,.5);burst(t,'bandpass',3200,3,v*.35,.18,.4);};
 const hit=(t,v=1)=>{swish(t,.2,600,3200,900,.65*v);const x=t+.16;
   const o=osc('sine',120,x,x+.6),g=C.createGain();o.frequency.exponentialRampToValueAtTime(38,x+.25);o.connect(g);env(g,x,.001,v,0,.42);out(g,.3);
   burst(x,'highpass',2500,.7,.7*v,.03,.3);burst(x,'lowpass',500,.8,.7*v,.25,.3);sweep(x,.26,2,3200,2400,700,.5*v,.2);
   [3410,5020,6870].forEach((f,i)=>tone('sine',f,x+.01,.001,.06*v/(i+1),.5,.4));};
 const fall=t=>{burst(t,'lowpass',240,.7,.7,.35,.35);const o=osc('sine',62,t,t+.5),g=C.createGain();o.frequency.exponentialRampToValueAtTime(34,t+.2);o.connect(g);env(g,t,.003,.7,0,.35);out(g,.3);
   burst(t+.22,'lowpass',300,.7,.45,.3,.35);};
 /* 3 the killing: no music, only the blade */
 const kill={
  K1:t=>{scrapeM(t,.55,.6);shingM(t+.53,1);hit(t+1.45);},
  K2:t=>{scrapeM(t,.25,.7);shingM(t+.24,1.1,2.4);hit(t+1.15,1.1);},
  K3:t=>{scrapeM(t,.45,.6);shingM(t+.43,1);hit(t+1.2);fall(t+1.85);}};
 /* 4 the Doctor: warm and reassuring */
 const doc={
  A:t=>{beat(t,.35);beat(t+.95,.3);strings(t+.2,1.2,[261.63,329.63,392],.03,1600,.6);strings(t+1.4,1.1,[261.63,349.23,440],.03,1600,.4);strings(t+2.5,1.2,[261.63,329.63,392,523.25],.03,1700,.4);},
  B:t=>{[[659.25,0],[587.33,.45],[523.25,.9],[587.33,1.35],[659.25,1.8],[783.99,2.3]].forEach(([f,d])=>piano(t+d,f,.11,1.8));pad(t,3.4,[130.81,196,261.63],.03);},
  C:t=>{[523.25,659.25,783.99,1046.5].forEach((f,i)=>{const o=osc('sine',f,t+i*.35,t+3.6),g=C.createGain();o.connect(g);env(g,t+i*.35,1,.045,1,1.2);out(g,.8);});
   for(let i=0;i<10;i++){const p=[1567.98,1760,2093,2349.32,2637.02][i%5];celesta(t+.4+i*.27+Math.random()*.08,p,.035);}pad(t,3.4,[130.81,196],.03);}};
 /* 5 the Detective: determined, a mystery to solve */
 const det={
  A:t=>{[110,130.81,146.83,155.56,164.81,196,164.81,146.83].forEach((f,i)=>{dbass(t+i*.36,f);brush(t+i*.36+.18);});
   [[329.63,0,.3],[392,.36,.3],[440,.72,.3],[466.16,1.08,.5],[440,1.62,.9]].forEach(([f,d,l])=>brass(t+1+d,f,l,.06));},
  B:t=>{const notes=[55,55,55,55,58.27,58.27,58.27,58.27,61.74,61.74,61.74,61.74,65.41,65.41];notes.forEach((f,i)=>tone('sawtooth',f,t+i*.18,.005,.12,.14,.15,500));
   tremolo(t,2.5,440,.03);tremolo(t+.8,1.7,523.25,.025);boom(t+2.55,.7);[110,130.81,164.81,220].forEach(f=>brass(t+2.55,f,.9,.06));},
  C:t=>{strings(t,3.2,[110,164.81],.03,900,.8);[[880,0],[1046.5,.35],[987.77,.7],[830.61,1.05],[880,1.5],[659.25,2]].forEach(([f,d])=>celesta(t+.3+d,f,.1));
   for(let i=0;i<6;i++)burst(t+i*.5,'bandpass',i%2?2600:3200,6,.12,.02,.1);}};
 /* 6 the Mafia: our laugh at +1.6 s (when HA HA HA appears) */
 const laugh=(t,rate=1,echo=false)=>{if(!LAUGH)return;const s=C.createBufferSource(),g=C.createGain();s.buffer=LAUGH;s.playbackRate.value=rate;g.gain.value=1;s.connect(g);
   if(echo){const d=C.createDelay(1),fb=C.createGain(),lp=C.createBiquadFilter();d.delayTime.value=.28;fb.gain.value=.38;lp.type='lowpass';lp.frequency.value=2200;g.connect(d);d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(BUS);}
   out(g,.35);s.start(t);};
 const swell=(t,dur)=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='highpass';f.frequency.value=3000;s.connect(f);f.connect(g);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.06);out(g,.3);s.start(t);s.stop(t+dur+.1);};
 const thunder=(t,vol)=>{const s=noise(),lp=C.createBiquadFilter(),g=C.createGain();lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(120,t+3);
   s.connect(lp);lp.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.06);for(let k=1;k<14;k++)g.gain.setValueAtTime(vol*(.3+Math.random()*.7)*Math.pow(1-k/14,1.5)+.001,t+k*.22);
   g.gain.exponentialRampToValueAtTime(.0001,t+3.8);out(g,.5);s.start(t);s.stop(t+4);burst(t,'highpass',2500,.5,.3,.25,.5);};
 const organ=(t,dur)=>[130.81,155.56,196,261.63].forEach(f=>['square','sawtooth'].forEach(ty=>tone(ty,f,t,.6,.022,1.5,.6,1200,dur)));
 const maf={
  A:t=>{drone(t,4.6,49,.16);swell(t,1.55);laugh(t+1.6);},
  B:t=>{thunder(t+.1,.55);organ(t+.3,3.2);laugh(t+1.6);},
  C:t=>{for(let x=t;x<t+4.2;x+=.42)beat(x,.55);laugh(t+1.6,.85,true);}};
 return{bus(b){BUS=b;},laugh:()=>!!LAUGH,
  loadLaugh(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return C.decodeAudioData(u.buffer).then(b=>{LAUGH=b;return b.duration;});},
  S:{good,night,crack,kill,doc,det,maf}};
}
