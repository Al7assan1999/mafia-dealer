// A `// comment` in the middle of a long one-line statement silently hides the code after it.
// That happened three times (the ping in client.ts, start-up calls in main.ts, joinOnline). Fails `npm run check` when it finds code after a // comment.
import {readFileSync,readdirSync,statSync} from 'fs';import {join} from 'path';
const files=[];const walk=d=>{for(const f of readdirSync(d)){const p=join(d,f);if(statSync(p).isDirectory())walk(p);else if(p.endsWith('.ts'))files.push(p);}};
walk(new URL('./src',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const bad=[];
for(const f of files)readFileSync(f,'utf8').split('\n').forEach((line,i)=>{
  // the comment part: after a // that is not inside a string or a URL
  let q=null,j=-1;for(let k=0;k<line.length-1;k++){const c=line[k];if(q){if(c==='\\')k++;else if(c===q)q=null;continue;}
    if(c==='"'||c==="'"||c==='`'){q=c;continue;}if(c==='/'&&line[k+1]==='/'&&line[k-1]!==':'&&line[k-1]!=='\\'){j=k;break;}}  // not "https://", not "\/\/" in a regex
  if(j<0)return;const rest=line.slice(j+2);
  if(/;\s*[A-Za-z_$][\w$.]*\s*[(=]|\)\s*\{|\}\)?;\s*$/.test(rest)&&/[;{}]/.test(rest))bad.push(`${f}:${i+1}: code after a // comment: ${rest.trim().slice(0,90)}`);});
if(bad.length){console.error(bad.join('\n'));process.exit(1);}
console.log('comments ok ('+files.length+' files)');
