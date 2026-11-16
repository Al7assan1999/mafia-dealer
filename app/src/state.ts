/* ---------- state ---------- */
const KEY='mafiaDealer.v1';
let S: Settings={lang:'en',players:['Player 1','Player 2','Player 3','Player 4','Player 5','Player 6'],
  counts:{mafia:1,doctor:1,detective:1},
  rules:{skip:true,decoy:true,self:true,rep:false,reveal:true,timer:180,norep:false,saverev:false,nightT:0,ghost:false,skipVote:true},
  vol:null,host:{buzzMax:3,kick:'lobby'},
  game:null,log:[],roster:[]};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){const R0=S.rules,H0=S.host;S=Object.assign(S,s);S.rules=Object.assign({},R0,s.rules||{});S.host=Object.assign({},H0,s.host||{});}}catch(e){}
if(!S.vol)S.vol={voice:S.rules.voice===false?0:1,sfx:S.rules.sfx===false?0:1};delete S.rules.voice;delete S.rules.sfx;
let G: Game=null;              // active game (S.game when playing)
let resumeOffer=!!S.game;
if(!Array.isArray(S.log))S.log=[];if(!Array.isArray(S.roster))S.roster=[];
let V: string='home',F={q:'',w:'all',v:'all',role:'any',res:'any'};
const nkey=(n: unknown)=>String(n).trim().toLowerCase().replace(/\s+/g,' ');
const isDefaultName=(n: unknown)=>/^(player|لاعب) \d+$/i.test(String(n).trim());
let timer: {left:number;run:boolean;h:any;at?:number}={left:S.rules.timer,run:false,h:null};
const save=()=>{try{if(G&&!G.mp)S.game=G;localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
const esc=(s: unknown)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(id: string)=>document.getElementById(id) as HTMLInputElement;  // typed as an input so .value works; it's any element
const nm=i=>esc(G.names[i]);
const aliveIdx=()=>G.alive.map((a,i)=>a?i:-1).filter(i=>i>=0);
const citizensCount=()=>S.players.length-S.counts.mafia-S.counts.doctor-S.counts.detective;
