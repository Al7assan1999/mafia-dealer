// Renders the launcher icon from design/icon-1b.svg (run from the repo root, needs Playwright from npm install):
//   node build/render_icon.js  ->  build/icon_bg.png, build/icon_fg.png (432x432 adaptive-icon layers, 108dp at xxxhdpi)
//                                  build/icon.png (192x192 full icon for Android 7, which has no adaptive icons)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const svg=fs.readFileSync(path.join(__dirname,'../design/icon-1b.svg'),'utf8');
const only=id=>svg.replace(/<g id="(bg|fg)">/g,(m,g)=>g===id?m:'<g id="'+g+'" display="none">');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({deviceScaleFactor:1})).newPage();
 const shot=async(markup,size,file,transparent,viewBox,radius)=>{
   const s=markup.replace('viewBox="0 0 108 108"',`viewBox="${viewBox||'0 0 108 108'}" width="${size}" height="${size}"`);
   await p.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px;overflow:hidden;border-radius:${radius||0}">${s}</div></body></html>`);
   await p.screenshot({path:path.join(__dirname,file),clip:{x:0,y:0,width:size,height:size},omitBackground:true});console.log('wrote build/'+file);};
 await shot(only('bg'),432,'icon_bg.png');
 await shot(only('fg'),432,'icon_fg.png',true);
 await shot(svg,192,'icon.png',true,'18 18 72 72','22%');  // the visible middle, as a rounded square
 await b.close();})();
