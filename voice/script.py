# New narrator script (v2.1). Two characters:
#   S = fairy-tale storyteller (town, mornings, days, the town winning)
#   M = monster (night, the Mafia, deaths, the Mafia winning)
# Each line is a list of (voice, text). Text is split at , . ! ? ... and the pieces are joined with real
# silences, so pauses never depend on the model. Keys match the clips the app already plays.
# usage: .venv/Scripts/python script.py [key ...]   -> out/lines/<key>.mp3 + out/lines/preview.html
import os, re, sys, json, base64, subprocess
import numpy as np, soundfile as sf

LINES = {
 "welcome":    ("Start of the game", [("S", "Once upon a time, in a quiet little town... everyone trusted their neighbours."), ("S", "But tonight, that ends."),
                                      ("M", "Some of you... are not what you seem."), ("M", "Look at your card, and tell... no one.")]),
 "night_1":    ("Night falls", [("M", "Close your eyes, little town... The night belongs to us now.")]),
 "night_2":    ("Night falls", [("M", "The candles go out, one by one... Sleep. If you can.")]),
 "night_3":    ("Night falls", [("M", "Hush now... Something is moving in the dark.")]),
 "night_4":    ("Night falls", [("M", "The moon is high, the streets are empty... and the Mafia is hungry.")]),
 "night_5":    ("Night falls", [("M", "Sleep tight, townsfolk... Not all of you will wake up.")]),
 "killed_1":   ("Morning, someone died", [("S", "The sun rises over the town..."), ("M", "but one bed is cold this morning. Last night, we took...")]),
 "killed_2":   ("Morning, someone died", [("S", "A scream broke the silence of the night!"), ("M", "Say goodbye to...")]),
 "killed_3":   ("Morning, someone died", [("S", "The rooster crows... but one voice is missing."), ("M", "The Mafia came for...")]),
 "was_citizen":("Role reveal", [("M", "Just an innocent citizen. What a pity.")]),
 "was_doctor": ("Role reveal", [("M", "The Doctor... who could not save themselves.")]),
 "was_detective":("Role reveal", [("M", "The Detective. They knew too much.")]),
 "was_mafia":  ("Role reveal", [("S", "A member of the Mafia! The town strikes back!")]),
 "safe_1":     ("Morning, nobody died", [("S", "Good morning, sleepy town! The sun is shining... and everyone is still here!")]),
 "safe_2":     ("Morning, nobody died", [("S", "The rooster crows, the birds sing... and not a single soul was lost tonight.")]),
 "safe_3":     ("Morning, nobody died", [("S", "What a miracle! The night has passed... and nobody was harmed.")]),
 "saved_1":    ("Morning, Doctor saved someone", [("S", "The Mafia crept through the night... but a kind healer was waiting. The Doctor saved...")]),
 "saved_2":    ("Morning, Doctor saved someone", [("S", "Knives in the dark, but magic in the air! The Doctor protected...")]),
 "day":        ("Discussion starts", [("S", "Gather round, good people of the town. Someone here is lying... Find them.")]),
 "day_2":      ("Discussion starts", [("S", "Talk, argue, accuse... but choose wisely."), ("M", "The wrong choice... feeds the wolves.")]),
 "timeup":     ("Timer ends", [("S", "Time is up! Hands up, voices down. It is time to vote.")]),
 "vote_out":   ("Vote result", [("S", "The town has spoken... and the town says goodbye to...")]),
 "vote_out_2": ("Vote result", [("S", "The votes are counted. Leaving the town today is...")]),
 "vote_none":  ("Vote: nobody", [("S", "The town shows mercy. No one leaves today..."), ("M", "but the night is coming.")]),
 "vote_tie":   ("Vote: tie", [("S", "The votes are split, right down the middle. No one leaves today.")]),
 "laugh":      ("Mafia wins (laugh)", [("M", "Ha... ha ha ha... Ha ha ha ha!")]),
 "mafia_win":  ("Mafia wins", [("M", "The town sleeps... forever. The Mafia wins! The killers among you were...")]),
 "citizens_win":("Citizens win", [("S", "And so, the shadows were driven away! The town is safe once more... The citizens win! The Mafia was...")]),
}
NAMED = {"killed_1", "killed_2", "killed_3", "saved_1", "saved_2", "vote_out", "vote_out_2", "mafia_win", "citizens_win"}
PREVIEW_NAME = "Halawy."

# ---- voices: Chatterbox copies a reference voice; references are made with Kokoro (synthetic, no real person)
REF = {"S": ("bm_george", 0.9, "Long ago, in a land of hills and rivers, there lived a wise old storyteller, who knew every secret of the town."),
       "M": ("am_onyx", 0.85, "Deep in the shadows, beneath the old town, something hungry waits for the night to fall.")}
GEN = {"S": dict(exaggeration=0.6, cfg_weight=0.4, temperature=0.8), "M": dict(exaggeration=0.9, cfg_weight=0.3, temperature=0.8)}
FX = {  # ffmpeg graphs, input [0:a] -> output [o]
 "S": "[0:a]aresample=48000,rubberband=pitch=0.94,bass=g=3:f=120,aecho=0.8:0.55:45|85:0.14|0.08,alimiter=limit=0.95[o]",
 "M": "[0:a]aresample=48000,asplit=2[a][b];[a]rubberband=pitch=0.74[x];[b]rubberband=pitch=0.5,volume=0.45,lowpass=1800[y];"
      "[x][y]amix=inputs=2:normalize=0,lowpass=5000,aecho=0.8:0.7:60|130:0.3|0.18,acompressor=threshold=0.1:ratio=3,alimiter=limit=0.95[o]",
}
PAUSE = {",": 0.25, ".": 0.5, "!": 0.45, "?": 0.5, "...": 0.75, "": 0.3}
SR = 48000
OUT = "out/lines"; os.makedirs(OUT, exist_ok=True)
TMP = "out/tmp"; os.makedirs(TMP, exist_ok=True)
TOKEN = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../hf.key"), encoding="utf-8-sig").read().strip()

def phrases(text):  # "a, b... c." -> [("a", ","), ("b", "..."), ("c", ".")]
    out = []
    for m in re.finditer(r"(.+?)(\.\.\.|[,.!?]|$)", text.strip()):
        t = m.group(1).strip()
        if t: out.append((t + (m.group(2) if m.group(2) != "," else ""), m.group(2)))
    return out

def trim(s, sr):
    a = np.abs(s); thr = max(a.max() * 0.02, 1e-4); idx = np.where(a > thr)[0]
    if not len(idx): return s
    pad = int(0.03 * sr); return s[max(idx[0] - pad, 0):idx[-1] + pad]

def refs():
    from huggingface_hub import hf_hub_download
    from kokoro_onnx import Kokoro
    paths = {v: f"{TMP}/ref_{v}.wav" for v in REF}
    if all(os.path.exists(p) for p in paths.values()): return paths
    repo = "onnx-community/Kokoro-82M-v1.0-ONNX"
    model = hf_hub_download(repo, "onnx/model.onnx", token=TOKEN)
    np.savez(f"{TMP}/voices.npz", **{n: np.fromfile(hf_hub_download(repo, f"voices/{n}.bin", token=TOKEN), dtype=np.float32).reshape(-1, 1, 256)
                                     for n, _, _ in REF.values()})
    k = Kokoro(model, f"{TMP}/voices.npz")
    class Sess:  # kokoro-onnx sends speed as int32 for this export, which wants float32 (0.9 would become 0)
        def __init__(s, x): s.x, s.speed = x, 1.0
        def get_inputs(s): return s.x.get_inputs()
        def run(s, o, feed, *a): feed["speed"] = np.array([s.speed], np.float32); return s.x.run(o, feed, *a)
    k.sess = Sess(k.sess)
    for v, (name, speed, text) in REF.items():
        k.sess.speed = speed
        s, sr = k.create(text, voice=name, speed=speed, lang="en-gb" if name.startswith("b") else "en-us")
        sf.write(paths[v], np.asarray(s).reshape(-1), sr)  # this export returns shape (1, n)
    return paths

def fx(s, sr, voice):
    src, dst = f"{TMP}/fx_in.wav", f"{TMP}/fx_out.wav"
    sf.write(src, s, sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", FX[voice], "-map", "[o]", "-ac", "1", "-ar", str(SR), dst], check=True)
    return sf.read(dst, dtype="float32")[0]

def main(keys):
    import torch
    from chatterbox.tts import ChatterboxTTS
    torch.set_num_threads(os.cpu_count())
    ref = refs()
    tts = ChatterboxTTS.from_pretrained(device="cpu")
    for key in keys:
        dst = f"{OUT}/{key}.mp3"
        if os.path.exists(dst): continue
        segs = list(LINES[key][1]) + ([(LINES[key][1][-1][0], PREVIEW_NAME)] if key in NAMED else [])
        audio = []
        for n, (voice, text) in enumerate(segs):
            for i, (ph, end) in enumerate(phrases(text)):
                torch.manual_seed(1000 + n * 50 + i)
                w = tts.generate(ph, audio_prompt_path=ref[voice], **GEN[voice]).squeeze(0).numpy()
                w = fx(trim(w, tts.sr), tts.sr, voice)
                audio += [w, np.zeros(int(PAUSE.get(end, 0.3) * SR), np.float32)]
        wav = f"{TMP}/{key}.wav"; sf.write(wav, np.concatenate(audio[:-1]), SR)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-b:a", "96k", dst], check=True)
        print("wrote", dst, flush=True)
    page()

def page():
    rows = []
    for n, (key, (when, segs)) in enumerate(LINES.items(), 1):
        f = f"{OUT}/{key}.mp3"
        if not os.path.exists(f): continue
        txt = " ".join(f'<span class="v{v}">{t}</span>' for v, t in segs) + (f' <span class="nm">[name]</span>' if key in NAMED else "")
        b64 = base64.b64encode(open(f, "rb").read()).decode()
        rows.append(f'<section data-k="{key}"><div class="hd"><b>{n}</b><span class="when">{when}</span><code>{key}</code></div><p>{txt}</p>'
                    f'<audio controls preload="none" src="data:audio/mpeg;base64,{b64}"></audio>'
                    f'<div class="ch"><button data-v="ok">Accept</button><button data-v="redo">Change</button>'
                    f'<input placeholder="What to change (optional)"></div></section>')
    open(f"{OUT}/preview.html", "w", encoding="utf-8").write(PAGE.replace("%ROWS%", "".join(rows)))
    print("wrote", f"{OUT}/preview.html", len(rows), "lines")

PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Narrator lines</title><style>
:root{color-scheme:dark;--bg:#0f0d12;--card:#1a1720;--line:#2c2734;--fg:#ece8f1;--dim:#a59fb0;--gold:#d9a441;--m:#e0605a;--s:#8fc7a0}
body{margin:0;padding:20px 16px 90px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}main{max-width:680px;margin:auto}
h1{font-size:22px;margin:0 0 4px}.intro{color:var(--dim);margin:0 0 18px}.key{display:flex;gap:14px;font-size:13px;margin:-8px 0 18px;color:var(--dim)}
section{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:12px}
section.ok{border-color:#3d7a52}section.redo{border-color:#8a4a2a}
.hd{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.hd b{color:var(--gold);min-width:22px}.when{font-weight:600}code{color:var(--dim);font-size:12px}
p{margin:8px 0 10px}.vS{color:var(--s)}.vM{color:var(--m)}.nm{color:var(--gold)}audio{width:100%;height:38px}
.ch{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}button{font:inherit;border-radius:10px;border:1px solid var(--line);background:#24202b;color:var(--fg);padding:8px 14px;cursor:pointer}
section.ok button[data-v=ok]{background:#2f6b45;border-color:#3d7a52}section.redo button[data-v=redo]{background:#7a3f22;border-color:#8a4a2a}
input{flex:1;min-width:160px;font:inherit;background:#120f16;color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
.bar{position:fixed;left:0;right:0;bottom:0;background:#15121acc;backdrop-filter:blur(8px);border-top:1px solid var(--line);padding:12px 16px;display:flex;justify-content:center;gap:12px;align-items:center}
.bar button{background:var(--gold);color:#1a1405;border:0;font-weight:700}#cnt{color:var(--dim);font-size:13px}
</style></head><body><main><h1>Narrator lines</h1>
<p class="intro">New script, two characters. Mark each line Accept or Change, add a note if you like, then press <b>Copy my choices</b> and paste the result in our chat.</p>
<div class="key"><span class="vS">&#9632; Storyteller</span><span class="vM">&#9632; Monster</span><span class="nm">[name] = the player's name (Halawy in the preview)</span></div>
%ROWS%</main><div class="bar"><span id="cnt"></span><button id="copy">Copy my choices</button></div><script>
const st={};let saved={};try{saved=JSON.parse(localStorage.getItem('lines')||'{}')}catch(e){}
document.querySelectorAll('section').forEach(s=>{const k=s.dataset.k,inp=s.querySelector('input');
 const set=v=>{st[k]={v,note:inp.value};s.className=v||'';save();};
 if(saved[k]){inp.value=saved[k].note||'';set(saved[k].v);}
 s.querySelectorAll('button').forEach(b=>b.onclick=()=>set(st[k]&&st[k].v===b.dataset.v?'':b.dataset.v));
 inp.oninput=()=>{st[k]=Object.assign(st[k]||{v:''},{note:inp.value});save();};});
function save(){try{localStorage.setItem('lines',JSON.stringify(st))}catch(e){}const a=Object.values(st);
 document.getElementById('cnt').textContent=a.filter(x=>x.v==='ok').length+' accepted, '+a.filter(x=>x.v==='redo').length+' to change';}
save();
document.getElementById('copy').onclick=async()=>{const out=[...document.querySelectorAll('section')].map(s=>{const x=st[s.dataset.k]||{};
 return s.dataset.k+': '+(x.v==='ok'?'ACCEPT':x.v==='redo'?'CHANGE':'not marked')+(x.note?' - '+x.note:'');}).join('\\n');
 try{await navigator.clipboard.writeText(out);document.getElementById('copy').textContent='Copied!';}catch(e){prompt('Copy this:',out);}};
</script></body></html>"""

if __name__ == "__main__":
    main(sys.argv[1:] or list(LINES))
