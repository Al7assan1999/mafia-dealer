/* ---------- the welcome's sounds (v2.15), picked on the sound board: 1A 2A 3K1 4C 5C 6A ----------
 * Made in code (like SND); the Mafia's laugh is our recorded clip (CLIPS.v_laugh). Each scene plays on its own gain,
 * the previous one fades out. Volume = Settings > Effects, the welcome's mute button = S.wlMute. design/sound-kit.js has every version. */
const WSFX=(()=>{
 let C: AudioContext=null,MS: GainNode=null,R: ConvolverNode=null,NB: AudioBuffer=null,LAUGH: AudioBuffer=null,BUS: GainNode=null,cur: GainNode=null;
 const imp=(sec: number,decay: number)=>{const n=Math.floor(C.sampleRate*sec),b=C.createBuffer(2,n,C.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}return b;};
 const noise=()=>{if(!NB){NB=C.createBuffer(1,C.sampleRate*2,C.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const s=C.createBufferSource();s.buffer=NB;s.loop=true;s.loopStart=Math.random();return s;};
 const out=(node: AudioNode,wet: number)=>{node.connect(BUS);if(wet){const g=C.createGain();g.gain.value=wet;node.connect(g);g.connect(R);}};
 const env=(g: GainNode,t: number,a: number,peak: number,hold: number,rel: number)=>{g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.setValueAtTime(peak,t+a+hold);g.gain.exponentialRampToValueAtTime(.0001,t+a+hold+rel);};
 const osc=(type: OscillatorType,f: number,t: number,stop: number)=>{const o=C.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.start(t);o.stop(stop);return o;};
 const tone=(type: OscillatorType,f: number,t: number,a: number,peak: number,rel: number,wet: number,filt?: number,hold=0)=>{const o=osc(type,f,t,t+a+hold+rel+.1),g=C.createGain();
   if(filt){const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filt;o.connect(lp);lp.connect(g);}else o.connect(g);env(g,t,a,peak,hold,rel);out(g,wet);return o;};
 const burst=(t: number,type: BiquadFilterType,freq: number,q: number,peak: number,rel: number,wet: number)=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type=type;f.frequency.value=freq;f.Q.value=q;
   s.connect(f);f.connect(g);env(g,t,.002,peak,0,rel);out(g,wet);s.start(t);s.stop(t+rel+.05);};
 const vib=(o: OscillatorNode,t: number,stop: number,rate: number,depth: number)=>{const l=osc('sine',rate,t,stop),lg=C.createGain();lg.gain.value=depth;l.connect(lg);lg.connect(o.frequency);};
 const bell=(t: number,f: number,vol: number)=>[[1,1,4],[2,.6,3],[2.4,.5,2.5],[3,.35,2],[4.2,.25,1.5],[5.4,.15,1]].forEach(([r,a,d])=>tone('sine',f*r,t,.005,vol*a,d,.9));
 const pad=(t: number,dur: number,fs: number[],vol: number)=>fs.forEach(f=>{const o=osc('triangle',f,t,t+dur+.2),g=C.createGain();o.connect(g);env(g,t,1,vol,Math.max(dur-2.2,.1),1.2);out(g,.6);});
 const sweep=(t: number,len: number,q: number,f0: number,fpk: number,f1: number,v: number,wet: number)=>{const s=noise(),bp=C.createBiquadFilter(),g=C.createGain();bp.type='bandpass';bp.Q.value=q;
   bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(fpk,t+len*.45);bp.frequency.exponentialRampToValueAtTime(f1,t+len);
   s.connect(bp);bp.connect(g);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+len*.45);g.gain.exponentialRampToValueAtTime(.0001,t+len);out(g,wet);s.start(t);s.stop(t+len+.05);};
 /* 1A the town: birdsong and a warm chord */
 const chirp=(t: number,f: number,len: number,vol: number)=>{const o=osc('sine',f,t,t+len+.05),g=C.createGain();o.frequency.exponentialRampToValueAtTime(f*1.55,t+len*.55);o.frequency.exponentialRampToValueAtTime(f*1.05,t+len);o.connect(g);env(g,t,.006,vol,0,len);out(g,.35);};
 const birds=(t: number,dur: number)=>{let x=t;while(x<t+dur){const n=2+Math.floor(Math.random()*4),f=2600+Math.random()*2200,sp=.07+Math.random()*.05;
   for(let k=0;k<n;k++)chirp(x+k*sp,f*(1+Math.random()*.08),.06+Math.random()*.04,.06+Math.random()*.06);x+=.3+Math.random()*.45;}};
 /* 2A night: crickets, an owl, a low bell; then the crack */
 const crickets=(t: number,dur: number,v=.05)=>{for(let x=t;x<t+dur;x+=.42+Math.random()*.12){const o=osc('sine',4300+Math.random()*300,x,x+.2),g=C.createGain();o.connect(g);g.gain.setValueAtTime(.0001,x);
   for(let k=0;k<3;k++){g.gain.setValueAtTime(v,x+k*.05);g.gain.setValueAtTime(.0001,x+k*.05+.025);}out(g,.2);}};
 const hoo=(t: number,len: number,v: number)=>{const o=osc('sine',380,t,t+len+.1),g=C.createGain(),lp=C.createBiquadFilter();o.frequency.exponentialRampToValueAtTime(330,t+len);vib(o,t,t+len+.1,5,6);
   lp.type='lowpass';lp.frequency.value=900;o.connect(lp);lp.connect(g);env(g,t,.08,v,len*.3,len*.6);out(g,.7);};
 const crack=(t: number)=>{burst(t,'highpass',1800,.7,.9,.09,.6);const o=osc('sine',140,t,t+.4),g=C.createGain();o.frequency.exponentialRampToValueAtTime(38,t+.25);o.connect(g);env(g,t,.002,.9,0,.3);out(g,.4);
   burst(t,'lowpass',320,.5,.5,.5,.5);burst(t+.24,'highpass',1500,.7,.22,.08,.9);};
 /* 3K1 the blade: drawn slowly through steel resonances, a loud SHING, then the hit */
 const STEEL=[2210,3120,4390,5660,7130,8790,10420];
 const scrape=(t: number,dur: number,v: number)=>{const s=noise(),am=C.createGain(),sum=C.createGain();sum.gain.value=v*2.4;s.connect(am);
   am.gain.setValueAtTime(0,t);for(let x=t;x<t+dur;x+=.004)am.gain.setValueAtTime((.25+Math.random()*.75)*(.5+.5*(x-t)/dur),x);am.gain.setValueAtTime(0,t+dur);
   STEEL.forEach(f=>{const bp=C.createBiquadFilter();bp.type='bandpass';bp.Q.value=24;bp.frequency.setValueAtTime(f*.93,t);bp.frequency.linearRampToValueAtTime(f*1.04,t+dur);am.connect(bp);bp.connect(sum);});
   const hp=C.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800;sum.connect(hp);out(hp,.35);s.start(t);s.stop(t+dur+.05);};
 const shing=(t: number,v: number,dur=1.8)=>{[2633,3517,4142,5288,6011,6950,7804,8611,9478,10305,11240,12190].forEach((f,i)=>[0,f*.0021].forEach(dt=>tone('sine',f+dt,t,.0015,v*(i<4?.16:.1)/(1+i*.12),dur*(1-i*.05),.55)));
   burst(t,'highpass',5000,.7,v*.55,.35,.5);burst(t,'bandpass',3200,3,v*.35,.18,.4);};
 const hit=(t: number,v=1)=>{sweep(t,.2,2.5,600,3200,900,.65*v,.25);sweep(t,.2,16,1760,3680,1920,.58*v,.3);const x=t+.16;
   const o=osc('sine',120,x,x+.6),g=C.createGain();o.frequency.exponentialRampToValueAtTime(38,x+.25);o.connect(g);env(g,x,.001,v,0,.42);out(g,.3);
   burst(x,'highpass',2500,.7,.7*v,.03,.3);burst(x,'lowpass',500,.8,.7*v,.25,.3);sweep(x,.26,2,3200,2400,700,.5*v,.2);
   [3410,5020,6870].forEach((f,i)=>tone('sine',f,x+.01,.001,.06*v/(i+1),.5,.4));};
 /* 4C the Doctor: a healing glow; 5C the Detective: a mystery theme */
 const celesta=(t: number,f: number,v=.09)=>{tone('sine',f,t,.002,v,1.2,.6);tone('sine',f*4,t,.002,v*.25,.4,.6);tone('sine',f*2,t,.002,v*.2,.7,.6);};
 const strings=(t: number,dur: number,fs: number[],vol: number,cut=1400,att=.7)=>fs.forEach(f=>[0,-6,6].forEach(c=>{const o=osc('sawtooth',f*Math.pow(2,c/1200),t,t+dur+1.4),lp=C.createBiquadFilter(),g=C.createGain();
   vib(o,t,t+dur+1.4,5,f*.004);lp.type='lowpass';lp.frequency.value=cut;o.connect(lp);lp.connect(g);env(g,t,att,vol,Math.max(dur-att,.05),1.2);out(g,.6);}));
 /* 6A the Mafia: a deep horror drone, a rising swell, our laugh when HA HA HA appears */
 const drone=(t: number,dur: number,f: number,vol: number)=>{const lp=C.createBiquadFilter(),g=C.createGain();lp.type='lowpass';lp.Q.value=6;lp.frequency.setValueAtTime(120,t);lp.frequency.exponentialRampToValueAtTime(600,t+dur*.45);lp.frequency.exponentialRampToValueAtTime(150,t+dur);
   ([['sawtooth',f],['sawtooth',f*1.008],['sine',f/2],['sawtooth',f*1.498]] as [OscillatorType,number][]).forEach(([ty,fr])=>osc(ty,fr,t,t+dur+.3).connect(lp));lp.connect(g);env(g,t,1,vol,Math.max(dur-2.4,.1),1.4);out(g,.5);};
 const swell=(t: number,dur: number)=>{const s=noise(),f=C.createBiquadFilter(),g=C.createGain();f.type='highpass';f.frequency.value=3000;s.connect(f);f.connect(g);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+dur);g.gain.exponentialRampToValueAtTime(.0001,t+dur+.06);out(g,.3);s.start(t);s.stop(t+dur+.1);};
 const laugh=(t: number)=>{if(!LAUGH)return;const s=C.createBufferSource(),g=C.createGain();s.buffer=LAUGH;s.connect(g);out(g,.35);s.start(t);};
 const SCN: Record<string,(t: number)=>void>={
  s1:t=>{birds(t,3.4);pad(t,3.6,[261.63,329.63,392,493.88],.028);tone('sine',1046.5,t+.4,.8,.016,2,.9);},
  s2:t=>{crickets(t,3.8);hoo(t+.4,.4,.1);hoo(t+1,.18,.08);hoo(t+1.25,.42,.1);bell(t+.2,110,.22);crack(t+1.7);},
  s3:t=>{scrape(t,.55,.6);shing(t+.53,1);hit(t+1.45);},
  s4:t=>{[523.25,659.25,783.99,1046.5].forEach((f,i)=>{const o=osc('sine',f,t+i*.35,t+3.6),g=C.createGain();o.connect(g);env(g,t+i*.35,1,.045,1,1.2);out(g,.8);});
    for(let i=0;i<10;i++)celesta(t+.4+i*.27+Math.random()*.08,[1567.98,1760,2093,2349.32,2637.02][i%5],.035);pad(t,3.4,[130.81,196],.03);},
  s5:t=>{strings(t,3.2,[110,164.81],.03,900,.8);[[880,0],[1046.5,.35],[987.77,.7],[830.61,1.05],[880,1.5],[659.25,2]].forEach(([f,d])=>celesta(t+.3+d,f,.1));
    for(let i=0;i<6;i++)burst(t+i*.5,'bandpass',i%2?2600:3200,6,.12,.02,.1);},
  s6:t=>{drone(t,4.6,49,.16);swell(t,1.55);laugh(t+1.6);}};
 const LEVEL: Record<string,number>={s1:2.1,s2:1,s3:.85,s4:1.5,s5:1.4,s6:.8};  // loudness matched on the board
 const vol=()=>S.wlMute?0:(S.vol?S.vol.sfx:.8);
 function init(){if(!C){C=SND.ctx()as AudioContext;if(!C)return false;MS=C.createGain();MS.connect(SND.out());
   R=C.createConvolver();R.buffer=imp(3,2.6);const rg=C.createGain();rg.gain.value=.45;R.connect(rg);rg.connect(MS);
   if(typeof CLIPS!=='undefined'&&CLIPS.v_laugh){const bin=atob(CLIPS.v_laugh),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);C.decodeAudioData(u.buffer).then(b=>{LAUGH=b;},()=>{});}}
  if(C.state==='suspended')Promise.resolve().then(()=>C.resume()).catch(()=>{});MS.gain.value=vol();return true;}
 function fade(b: GainNode,sec: number){if(!b)return;const t=C.currentTime;b.gain.cancelScheduledValues(t);b.gain.setValueAtTime(b.gain.value,t);b.gain.linearRampToValueAtTime(0,t+sec);setTimeout(()=>{try{b.disconnect();}catch(e){}},sec*1000+150);}
 return{
  /** a scene starts: its sound (the previous scene's fades out) */
  scene(k: string){try{if(!init())return;fade(cur,k==='end'?3:1);cur=null;const f=SCN[k];if(!f)return;const b=C.createGain();b.gain.value=LEVEL[k];b.connect(MS);BUS=cur=b;f(C.currentTime+.05);}catch(e){console.error('welcome sound',k,e);}},  // never breaks the welcome, but shows up in logs and tests
  stop(){if(C&&cur)fade(cur,.4);cur=null;},
  mute(){if(MS)MS.gain.value=vol();},
  playing:()=>!!cur};
})();
