/* ---------- game flow ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const r=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[r]]=[a[r],a[i]];}return a;}
function startGame(){
  if(new Set(S.players.map(nkey)).size<S.players.length){render();return;}
  const names=S.players.map((p,i)=>p.trim()||t('pname')+' '+(i+1));
  const deck=[];for(const r of ['mafia','doctor','detective'])for(let k=0;k<S.counts[r];k++)deck.push(r);
  while(deck.length<names.length)deck.push('citizen');
  names.filter(n=>!isDefaultName(n)).reverse().forEach(n=>{S.roster=S.roster.filter(x=>nkey(x)!==nkey(n));S.roster.unshift(n);});S.roster.length=Math.min(S.roster.length,30);
  G={acc:names.map(n=>me()&&nkey(n)===nkey(me().display)?me().id:null),ev:{first:null,saves:[],caught:[]},names,roles:shuffle(deck),alive:names.map(()=>true),day:1,phase:'deal',i:0,sel:null,
     skipUsed:false,act:{},lastProt:{},hist:[],morning:null,ballots:{},verdict:null,winner:null,mode:'consensus',revealed:false};
  resumeOffer=false;SND.unlock();NARR.welcome();enterGame();save();render();
}
function enterGame(){try{history.pushState({g:1},'');}catch(e){}}
function resumeGame(){SND.unlock();G=S.game;G.ev=G.ev||{first:null,saves:[],caught:[]};resumeOffer=false;enterGame();render();}
function discardGame(){S.game=null;G=null;resumeOffer=false;save();render();}
function go(phase: string,extra?: Partial<Game>){G.phase=phase;G.sel=null;G.revealed=false;if(extra)Object.assign(G,extra);save();if(G.mp)hostPublish();render();window.scrollTo(0,0);}
