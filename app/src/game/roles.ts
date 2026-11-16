/* ---------- setup ---------- */
function fixCounts(){const c=S.counts;c.doctor=1;c.mafia=Math.max(1,Math.min(10,c.mafia|0));c.detective=c.mafia>=2?Math.min(1,Math.max(0,c.detective|0)):0;}
const maxMafia=n=>Math.max(1,Math.floor((n-2)/2));
function deckErr(n,names){fixCounts();const c=n-S.counts.mafia-S.counts.doctor-S.counts.detective;
  if(n<4)return t('need3');if(c<0)return t('toomany');if((n-S.counts.mafia)-S.counts.mafia<2)return t('mafiaGap',{n:maxMafia(n)});
  if(names&&new Set(names.map(nkey)).size<n)return t('dupNames');return '';}
/* ---------- rules: presets + their own screen ---------- */
const PRESETS={classic:{skip:true,norep:false,saverev:false,decoy:true,self:true,rep:false,reveal:true,timer:180},
  beginner:{skip:false,norep:false,saverev:true,decoy:true,self:true,rep:false,reveal:true,timer:240}};
const presetOf=()=>Object.keys(PRESETS).find(p=>Object.entries(PRESETS[p]).every(([k,v])=>S.rules[k]===v))||'custom';
function setPreset(p){if(PRESETS[p])Object.assign(S.rules,PRESETS[p]);persist();render();}
const recMafia=n=>Math.max(1,Math.min(Math.round(n/4),maxMafia(n)));
const NT=[0,30,45,60,90,120,180];
const activeRules=()=>['skip','norep','saverev','decoy','self','rep','reveal','ghost'].filter(k=>S.rules[k]).concat(S.rules.skipVote===false?['noSkipVote']:[]);
