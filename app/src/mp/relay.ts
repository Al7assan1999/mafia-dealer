interface OnlineNet extends HostNet {
  cache: Record<string, string>; q: string[]; ws: WebSocket; dead: boolean; at?: number; beat?: any;
  tx(m: object): void; connect(): void;
}
function onlineNet(o: {code:string;key?:string}): OnlineNet{const N: OnlineNet={cache:{},q:[],ws:null,dead:false,start(){},ip(){return '0,0';},
  put(k,v){v=String(v);if(N.cache[k]===v)return;N.cache[k]=v;N.tx({t:'put',k,v});},
  take(){return N.q.length?N.q.shift():null;},
  clear(){N.cache={};N.tx({t:'clear'});},
  bc(v){N.tx({t:'bc',v});},
  to(id,v){if(!(N.ws&&N.ws.readyState===1))return false;N.tx({t:'to',id,v});return true;},  // live to one player, not stored (room chat)
  tx(m){try{if(N.ws&&N.ws.readyState===1)N.ws.send(JSON.stringify(m));}catch(e){}},
  close(){N.dead=true;const w=N.ws;setTimeout(()=>{try{w&&w.close();}catch(e){}},300);},
  connect(){if(N.dead)return;N.at=Date.now();const ws=N.ws=new WebSocket(relayUrl()+'/r/'+o.code+'?role=host&key='+o.key);
    ws.onopen=()=>{for(const k in N.cache)N.tx({t:'put',k,v:N.cache[k]});};
    ws.onmessage=e=>{N.at=Date.now();if(e.data==='pong')return;let m;try{m=JSON.parse(e.data);}catch(x){return;}if(m.a)N.q.push(m.a);if(m.q)N.q.push(...m.q);if(m.err){N.dead=true;toast(t('badCode'));}};
    ws.onclose=()=>{if(N.ws===ws&&!N.dead)setTimeout(N.connect,1500);};}};
  N.connect();N.beat=setInterval(()=>{if(N.dead){clearInterval(N.beat);return;}
    if(Date.now()-N.at>7000){const w=N.ws;N.ws=null;try{w&&w.close();}catch(e){}N.connect();}else if(N.ws&&N.ws.readyState===1)N.ws.send('ping');},2000);
  return N;}
