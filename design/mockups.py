# Builds design/directions.html: 3 visual directions x 4 key screens, fonts embedded so it opens anywhere.
# usage: python mockups.py <fontsource dir>
import base64, glob, os, sys
FD = sys.argv[1]
def font(fam, pkg, sub, w):
    f = glob.glob(f"{FD}/fontsource-{pkg}-*/package/files/{pkg}-{sub}-{w}-normal.woff2")[0]
    rng = "U+0600-06FF,U+0750-077F,U+FB50-FDFF,U+FE70-FEFF" if sub == "arabic" else "U+0000-00FF,U+2000-206F"
    return (f"@font-face{{font-family:'{fam}';src:url(data:font/woff2;base64,{base64.b64encode(open(f,'rb').read()).decode()}) format('woff2');"
            f"font-weight:{w};unicode-range:{rng};font-display:block}}")
FONTS = "".join([
    font("Cinzel", "cinzel", "latin", 700), font("Ruqaa", "aref-ruqaa", "arabic", 700), font("Ruqaa", "aref-ruqaa", "latin", 700),
    font("Plex", "ibm-plex-sans-arabic", "latin", 400), font("Plex", "ibm-plex-sans-arabic", "arabic", 400),
    font("Plex", "ibm-plex-sans-arabic", "latin", 700), font("Plex", "ibm-plex-sans-arabic", "arabic", 700),
    font("Elite", "special-elite", "latin", 400), font("Messiri", "el-messiri", "arabic", 700), font("Messiri", "el-messiri", "latin", 700),
    font("Readex", "readex-pro", "latin", 400), font("Readex", "readex-pro", "arabic", 400), font("Readex", "readex-pro", "latin", 700),
    font("Readex", "readex-pro", "arabic", 700),
])
I = {  # tiny inline icons
 "moon": '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
 "wifi": '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/></svg>',
 "globe": '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
 "hat": '<svg viewBox="0 0 24 24"><path d="M4 15c0-1 1-2 2.5-2.3L8 6.5C8.3 5.3 9.2 5 10 5.4l2 1 2-1c.8-.4 1.7-.1 2 1.1l1.5 6.2C19 13 20 14 20 15c0 1.6-3.6 3-8 3s-8-1.4-8-3z"/></svg>',
 "phone": '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/></svg>',
 "users": '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2c2.3.2 4.1 1.8 4.6 4.3"/></svg>',
}
NAMES = [("Alhassan", ""), ("Dareer", ""), ("Sami", "mate"), ("Hokan", ""), ("Farouq", "")]

def screens(d):
    sel = 3  # Hokan selected
    rows = "".join(f'<div class="opt{" sel" if i == sel else ""}{" dis" if n == "Sami" else ""}"><span class="num">{i+1}</span><b>{n}</b>'
                   f'{"<small>partner</small>" if t else ""}<span class="rad"></span></div>' for i, (n, t) in enumerate(NAMES[1:], 1) if True)
    return f"""
<div class="phone"><div class="scr home">
  <div class="sky"></div><div class="logo">{I['hat']}</div>
  <h1>Mafia Dealer</h1><div class="ar">موزّع المافيا</div><p class="tag">Someone at this table is lying.</p>
  <button class="b1">{I['phone']}<span><b>New game</b><small>One phone, passed around</small></span></button>
  <button class="b2">{I['users']}<span><b>Play Together</b><small>Each player on their own phone</small></span></button>
  <div class="row3"><button>History</button><button>Stats</button><button>How to play</button></div>
  <button class="lang">عربي</button></div><div class="cap">Home</div></div>
<div class="phone"><div class="scr">
  <div class="top"><span class="back">‹</span><h2>Play Together</h2></div>
  <label class="fl">Your name</label><div class="inp">Alhassan</div>
  <div class="tile t1"><div class="ti">{I['wifi']}</div><b>Same room</b><small>Same Wi-Fi or a phone hotspot. The host phone is the table.</small><span class="go">›</span></div>
  <div class="tile t2"><div class="ti">{I['globe']}</div><b>Online</b><small>Friends anywhere. Join with a 6-digit room code.</small><span class="go">›</span></div>
  <p class="note">Each mode opens its own screen.</p></div><div class="cap">Play Together: pick a mode</div></div>
<div class="phone"><div class="scr role">
  <div class="kick">Your role</div><div class="card"><div class="ri">{I['hat']}</div><div class="rn">Mafia</div><div class="rar">المافيا</div>
  <p>Each night, choose someone to eliminate. By day, act innocent.</p><div class="mate">Your partner: <b>Sami</b></div></div>
  <button class="b1 w">Got it</button></div><div class="cap">Role card</div></div>
<div class="phone"><div class="scr night">
  <div class="sky"></div><div class="nh"><span class="moon">{I['moon']}</span><span>Night 2</span></div>
  <h2 class="q">Choose your target</h2><p class="sub">Sami picked Hokan</p>
  <div class="list">{rows}</div><button class="b1 w">Confirm</button></div><div class="cap">Night action</div></div>"""

CSS = """
*{box-sizing:border-box;margin:0;padding:0}body{background:#ececee;font:15px/1.45 system-ui,sans-serif;color:#222;padding:28px 16px 60px}
main{max-width:1320px;margin:auto}h1.t{font-size:26px;margin-bottom:6px}.intro{color:#555;max-width:760px;margin-bottom:26px}
.dir{margin-bottom:46px}.dir>h2{font-size:21px;margin-bottom:2px}.dir>p{color:#555;margin-bottom:14px;max-width:820px}
.phones{display:flex;gap:18px;overflow-x:auto;padding-bottom:8px}.phone{flex:0 0 280px}.cap{text-align:center;font-size:12.5px;color:#666;margin-top:8px}
.scr{position:relative;height:590px;border-radius:30px;overflow:hidden;padding:22px 18px;display:flex;flex-direction:column;box-shadow:0 10px 30px #0003}
.scr svg{width:22px;height:22px;fill:currentColor;stroke:currentColor}.scr svg[fill=none]{fill:none}
button{font:inherit;color:inherit;border:0;background:none;cursor:pointer;text-align:start}
.home{align-items:center;text-align:center}.logo{width:76px;height:76px;display:grid;place-items:center;margin-top:24px}.logo svg{width:42px;height:42px}
.home h1{margin-top:14px}.home .tag{margin:6px 0 22px;font-size:13px}.home .b1,.home .b2{width:100%;display:flex;gap:14px;align-items:center;padding:16px;margin-bottom:12px}
.home .b1 span,.home .b2 span{display:flex;flex-direction:column}.home small{font-size:12px;font-weight:400}
.row3{display:flex;gap:8px;width:100%;margin-top:4px}.row3 button{flex:1;text-align:center;padding:11px 4px;font-size:12.5px}.lang{margin-top:auto;font-size:13px;padding:6px 14px}
.top{display:flex;align-items:center;gap:10px;margin-bottom:18px}.back{font-size:26px;line-height:1;width:34px;height:34px;display:grid;place-items:center}
.fl{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}.inp{padding:12px 14px;margin-bottom:16px}
.tile{position:relative;padding:18px 44px 18px 18px;margin-bottom:12px}.tile b{display:block;font-size:19px;margin:10px 0 2px}.tile small{font-size:12.5px;display:block}
.ti{width:44px;height:44px;display:grid;place-items:center}.go{position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:26px}.note{font-size:12px;text-align:center;margin-top:auto}
.role{justify-content:center}.kick{text-align:center;font-size:12px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
.card{padding:26px 20px;text-align:center;margin-bottom:18px}.ri{width:70px;height:70px;margin:0 auto 12px;display:grid;place-items:center}.ri svg{width:40px;height:40px}
.rn{font-size:36px;line-height:1.1}.rar{font-size:22px;margin:2px 0 10px}.card p{font-size:13.5px}.mate{margin-top:14px;padding:9px;font-size:13px}
.w{width:100%;text-align:center;padding:15px}.night .nh{display:flex;align-items:center;gap:8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase}
.q{font-size:24px;margin:12px 0 2px}.sub{font-size:12.5px;margin-bottom:14px}.list{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.opt{display:flex;align-items:center;gap:10px;padding:11px 12px}.opt b{flex:1;font-weight:600}.opt small{font-size:11px}.num{width:24px;height:24px;display:grid;place-items:center;font-size:12px;border-radius:50%}
.rad{width:18px;height:18px;border-radius:50%}.opt.dis{opacity:.45}.night button.w{margin-top:auto}.sky{position:absolute;inset:0;pointer-events:none}.scr>*{position:relative}

/* 1 Moonlit Tale */
.d1 .scr{background:radial-gradient(130% 70% at 50% 0%,#24305e 0%,#121735 45%,#0a0c1d 100%);color:#efe7d2;font-family:Plex,sans-serif}
.d1 .sky{background-image:radial-gradient(1.2px 1.2px at 20% 12%,#fff8 50%,#0000),radial-gradient(1px 1px at 70% 8%,#fff9 50%,#0000),radial-gradient(1.4px 1.4px at 85% 22%,#fff7 50%,#0000),radial-gradient(1px 1px at 40% 28%,#fff6 50%,#0000),radial-gradient(1px 1px at 10% 35%,#fff5 50%,#0000)}
.d1 h1,.d1 h2,.d1 .rn,.d1 .tile b,.d1 .q{font-family:Cinzel,Ruqaa,serif;letter-spacing:.03em;color:#f3d48a}.d1 .ar,.d1 .rar{font-family:Ruqaa,serif;color:#d9b866;font-size:22px}
.d1 .logo{border-radius:50%;background:radial-gradient(circle at 35% 30%,#fbe7b0,#d6a645 60%,#8a6420);color:#1a1530;box-shadow:0 0 40px #f3d48a55}
.d1 .tag,.d1 small,.d1 .sub,.d1 .note,.d1 .fl,.d1 .kick,.d1 .card p{color:#b8b2c9}
.d1 .b1{background:linear-gradient(180deg,#f3d48a,#c9993f);color:#1b1630;border-radius:999px;font-weight:700;box-shadow:0 6px 20px #c9993f44}
.d1 .home .b1,.d1 .home .b2{border-radius:18px}.d1 .b2,.d1 .row3 button,.d1 .lang,.d1 .inp,.d1 .tile,.d1 .opt,.d1 .back{background:#ffffff0d;border:1px solid #f3d48a33;border-radius:14px}
.d1 .tile{border-radius:20px}.d1 .ti{border-radius:50%;background:#f3d48a1f;color:#f3d48a}.d1 .t2 .ti{background:#9fb6ff22;color:#b9c8ff}
.d1 .card{background:linear-gradient(180deg,#2a1730,#160f22);border:1px solid #f3d48a55;border-radius:22px;box-shadow:0 0 0 6px #f3d48a10,0 20px 40px #0008}
.d1 .ri{border-radius:50%;background:#e0605a22;color:#ff8a7a}.d1 .rn{color:#ff8a7a}.d1 .mate{background:#e0605a1a;border-radius:10px;color:#ffc1b8}
.d1 .opt.sel{border-color:#f3d48a;background:#f3d48a1a}.d1 .num{background:#ffffff14}.d1 .rad{border:2px solid #f3d48a66}.d1 .opt.sel .rad{background:#f3d48a;box-shadow:inset 0 0 0 3px #1b1630}
.d1 .moon{color:#f3d48a}.d1 .opt small{color:#ff8a7a}
.d1 .b1 small{color:#4a3d22}.d2 .b1 small{color:#f6efe2cc}.d3 .b1 small{color:#ffe3ea}

/* 2 Noir Case File */
.d2 .scr{background:#0d0c0b;color:#e9e1d1;font-family:Plex,sans-serif}
.d2 .sky{background:radial-gradient(90% 50% at 50% 0%,#3a0d0d66,#0000 70%),repeating-linear-gradient(0deg,#ffffff03 0 2px,#0000 2px 4px)}
.d2 h1,.d2 h2,.d2 .tile b,.d2 .q,.d2 .kick,.d2 .fl,.d2 .nh,.d2 .cap2{font-family:Elite,Messiri,monospace}.d2 .ar,.d2 .rar{font-family:Messiri,serif;color:#b9a98c}
.d2 h1{font-size:30px;letter-spacing:.04em}.d2 .logo{border:2px solid #b3241f;color:#b3241f;transform:rotate(-6deg);border-radius:6px}
.d2 .tag,.d2 small,.d2 .sub,.d2 .note,.d2 .fl,.d2 .kick{color:#9a9183}
.d2 .b1{background:#b3241f;color:#f6efe2;border-radius:4px;font-weight:700;letter-spacing:.04em}
.d2 .b2,.d2 .row3 button,.d2 .lang,.d2 .inp,.d2 .opt,.d2 .back{background:#1a1816;border:1px solid #3a352e;border-radius:4px}
.d2 .tile{background:#e9e1d1;color:#1c1915;border-radius:3px;box-shadow:3px 3px 0 #b3241f}.d2 .tile small{color:#5a5248}.d2 .ti{color:#b3241f;border:1.5px solid #b3241f;border-radius:3px}
.d2 .card{background:#e9e1d1;color:#1c1915;border-radius:3px;position:relative;box-shadow:0 18px 40px #000a}
.d2 .card:after{content:"CLASSIFIED";position:absolute;top:16px;right:-8px;transform:rotate(12deg);font-family:Elite,monospace;color:#b3241f;border:2px solid #b3241f;padding:2px 8px;font-size:12px}
.d2 .rn{font-family:Elite,monospace;color:#b3241f;font-size:40px}.d2 .ri{color:#1c1915;border:2px dashed #1c1915;border-radius:50%}.d2 .card p{color:#3d362d}.d2 .mate{border-top:1px dashed #9a8f7c;color:#1c1915}
.d2 .opt.sel{border-color:#b3241f;background:#2a1311}.d2 .num{background:#2a2622;border-radius:2px}.d2 .rad{border:2px solid #5b5348;border-radius:2px}
.d2 .opt.sel .rad{background:#b3241f;border-color:#b3241f}.d2 .moon{color:#b3241f}.d2 .opt small{color:#d65a50}

/* 3 Neon Night (modern) */
.d3 .scr{background:linear-gradient(170deg,#17131f,#0b0a10 60%);color:#f4f2f8;font-family:Readex,sans-serif}
.d3 .sky{background:radial-gradient(60% 35% at 15% 0%,#ff2e6355,#0000 70%),radial-gradient(55% 30% at 100% 25%,#3d6bff33,#0000 70%)}
.d3 h1{font-size:30px;font-weight:700}.d3 .ar,.d3 .rar{color:#c9c3d6}.d3 .logo{border-radius:24px;background:linear-gradient(135deg,#ff2e63,#ff8a3d);box-shadow:0 12px 30px #ff2e6355}
.d3 .tag,.d3 small,.d3 .sub,.d3 .note,.d3 .fl,.d3 .kick,.d3 .card p{color:#a49db3}
.d3 .b1{background:linear-gradient(135deg,#ff2e63,#ff6a3d);border-radius:16px;font-weight:700;box-shadow:0 10px 24px #ff2e6344}
.d3 .b2,.d3 .row3 button,.d3 .lang,.d3 .inp,.d3 .opt,.d3 .back{background:#ffffff0b;border:1px solid #ffffff14;border-radius:16px;backdrop-filter:blur(10px)}
.d3 .tile{border-radius:22px;border:1px solid #ffffff14}.d3 .t1{background:linear-gradient(135deg,#1f3b2e,#14171d)}.d3 .t2{background:linear-gradient(135deg,#1d2a52,#14171d)}
.d3 .ti{border-radius:14px;background:#3ccf9126;color:#5ff0b0}.d3 .t2 .ti{background:#5a8bff26;color:#8fb0ff}
.d3 .card{border-radius:26px;background:linear-gradient(160deg,#3a0f1f,#1a1020 70%);border:1px solid #ff2e6355;box-shadow:0 20px 50px #ff2e6322}
.d3 .ri{border-radius:22px;background:linear-gradient(135deg,#ff2e63,#ff8a3d);color:#fff}.d3 .rn{font-weight:700;color:#ff5c84}.d3 .mate{background:#ff2e631a;border-radius:12px}
.d3 .opt.sel{border-color:#ff2e63;background:#ff2e631a}.d3 .num{background:#ffffff12}.d3 .rad{border:2px solid #ffffff33}.d3 .opt.sel .rad{background:#ff2e63;border-color:#ff2e63}
.d3 .moon{color:#8fb0ff}.d3 .opt small{color:#ff5c84}
"""
DIRS = [
 ("d1", "1 · Moonlit Tale", "A storybook night: deep blue sky with stars, gold, a classic serif for titles (Cinzel, and Aref Ruqaa calligraphy in Arabic). Matches the storyteller and monster narrator. Day screens would switch to warm parchment."),
 ("d2", "2 · Noir Case File", "Film-noir crime drama: black and bone-white, one blood-red accent, typewriter headings, role cards like a stamped secret file. Cinematic and serious."),
 ("d3", "3 · Neon Night", "Modern game app: glassy cards, warm neon gradients, a clean rounded font that pairs Arabic and English well (Readex Pro). Bright, playful, very readable."),
]
page = (f"<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
        f"<title>Design directions</title><style>{FONTS}{CSS}</style></head><body><main><h1 class='t'>Mafia Dealer: three design directions</h1>"
        f"<p class='intro'>Same four screens in each style. Pick one (or mix: \"1 with the cards of 3\"). Everything else — setup, lobby, morning, vote, history, stats — gets rebuilt in the chosen style. The Play Together screen now only picks a mode; Same room and Online each open their own screen.</p>"
        + "".join(f"<section class='dir {c}'><h2>{t}</h2><p>{d}</p><div class='phones'>{screens(c)}</div></section>" for c, t, d in DIRS)
        + "</main></body></html>")
os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "directions.html"), "w", encoding="utf-8").write(page)
print("wrote design/directions.html", len(page) // 1024, "KB")
