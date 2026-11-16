# Name clips + laugh variants with the new voices (S storyteller, M monster).
#   .venv/Scripts/python names2.py audition   -> out/audition/*.mp3 + audition.html (laughs + friends' names, 2 spellings each)
#   .venv/Scripts/python names2.py all        -> out/names/{n,m}_<key>.wav for every name (after spellings are approved)
import os, sys, json, re, base64, subprocess
import numpy as np, soundfile as sf
import script as S  # refs(), fx(), trim(), GEN, FX, SR

S.FX["L"] = "[0:a]aresample=48000,rubberband=pitch=0.8,bass=g=4:f=120,aecho=0.8:0.5:50:0.18,acompressor=threshold=0.1:ratio=3,alimiter=limit=0.95[o]"
S.FX["L2"] = ("[0:a]aresample=48000,asplit=2[a][b];[a]rubberband=pitch=0.78[x];[b]rubberband=pitch=0.55,volume=0.22,lowpass=1500[y];"
              "[x][y]amix=inputs=2:normalize=0,highpass=f=90,aecho=0.8:0.6:70|140:0.22|0.12,acompressor=threshold=0.1:ratio=3,alimiter=limit=0.95[o]")
LAUGHS = [  # (tag, text, generation, fx)
    ("laugh_a", "Mwahahaha... Hahahahaha!", dict(exaggeration=1.2, cfg_weight=0.3, temperature=0.8), "L"),
    ("laugh_b", "Heh heh heh... Ha ha ha ha ha!", dict(exaggeration=1.0, cfg_weight=0.3, temperature=0.8), "L"),
    ("laugh_c", "Ah ha ha ha ha... Ha ha ha ha ha ha!", dict(exaggeration=1.3, cfg_weight=0.25, temperature=0.9), "L2"),
]
FRIENDS = {  # key -> (spelling A = current, spelling B = syllables)
    "alhassan": ("Al Hassan", "Al-Has-san"), "dareer": ("Dareer", "Da-reer"), "halawy": ("Halawee", "Ha-la-wee"),
    "farouq": ("Farooq", "Fa-rooq"), "sami": ("Sami", "Sah-mee"), "hokan": ("Hokahn", "Ho-kahn"),
    "fater": ("Fahter", "Fah-ter"), "khaddour": ("Khaddoor", "Khad-door"),
}
OUT = "out/audition"; NOUT = "out/names"
for d in (OUT, NOUT): os.makedirs(d, exist_ok=True)

def say(tts, ref, text, voice, gen=None, fxv=None, seed=7):
    import torch
    torch.manual_seed(seed)
    w = tts.generate(text, audio_prompt_path=ref, **(gen or S.GEN[voice])).squeeze(0).numpy()
    return S.fx(S.trim(w, tts.sr), tts.sr, fxv or voice)

def save(w, path):
    tmp = path.rsplit(".", 1)[0] + ".wav"; sf.write(tmp, w, S.SR)
    if path.endswith(".mp3"): subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-ac", "1", "-b:a", "96k", path], check=True); os.remove(tmp)

def load():
    import torch
    from chatterbox.tts import ChatterboxTTS
    torch.set_num_threads(os.cpu_count())
    return S.refs(), ChatterboxTTS.from_pretrained(device="cpu")

def audition():
    ref, tts = load()
    for tag, text, gen, fxv in LAUGHS:
        p = f"{OUT}/{tag}.mp3"
        if not os.path.exists(p): save(say(tts, ref["M"], text, "M", gen, fxv), p); print("wrote", p, flush=True)
    for key, spellings in FRIENDS.items():
        for ab, sp in zip("AB", spellings):
            for v in "SM":
                p = f"{OUT}/{key}_{ab}_{v}.mp3"
                if not os.path.exists(p): save(say(tts, ref[v], sp + ".", v), p); print("wrote", p, flush=True)
    page()

def page():
    b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()
    au = lambda p: f'<audio controls preload="none" src="data:audio/mpeg;base64,{b64(p)}"></audio>'
    laughs = "".join(f'<label class="row"><input type="radio" name="laugh" value="{t[-1].upper()}"><b>{t[-1].upper()}</b>{au(f"{OUT}/{t}.mp3")}</label>' for t, *_ in LAUGHS)
    names = "".join(
        f'<section data-k="{k}"><h3>{k.title()}</h3>' + "".join(
            f'<label class="row"><input type="radio" name="{k}" value="{ab}"><b>{ab}</b><span class="sp">{sp}</span>'
            f'<span class="v">Storyteller</span>{au(f"{OUT}/{k}_{ab}_S.mp3")}<span class="v">Monster</span>{au(f"{OUT}/{k}_{ab}_M.mp3")}</label>'
            for ab, sp in zip("AB", sps)) + '<input class="note" placeholder="Neither? Write how it should sound"></section>'
        for k, sps in FRIENDS.items())
    open(f"{OUT}/audition.html", "w", encoding="utf-8").write(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laugh and names</title><style>
:root{{color-scheme:dark}}body{{margin:0;padding:20px 16px 90px;background:#0f0d12;color:#ece8f1;font:15px/1.5 system-ui,sans-serif}}main{{max-width:760px;margin:auto}}
h1{{font-size:22px;margin:0 0 4px}}h2{{font-size:17px;margin:26px 0 10px}}p{{color:#a59fb0;margin:0 0 14px}}section{{background:#1a1720;border:1px solid #2c2734;border-radius:14px;padding:12px 14px;margin-bottom:10px}}
h3{{margin:0 0 6px;font-size:16px}}.row{{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0;cursor:pointer}}.row b{{color:#d9a441;width:16px}}.sp{{min-width:110px;color:#cfc8da}}
.v{{font-size:12px;color:#a59fb0}}audio{{height:34px;max-width:100%}}.note{{width:100%;box-sizing:border-box;margin-top:6px;font:inherit;background:#120f16;color:#ece8f1;border:1px solid #2c2734;border-radius:10px;padding:8px 10px}}
.bar{{position:fixed;left:0;right:0;bottom:0;background:#15121acc;border-top:1px solid #2c2734;padding:12px;text-align:center}}.bar button{{font:inherit;font-weight:700;background:#d9a441;color:#1a1405;border:0;border-radius:10px;padding:9px 18px}}
</style></head><body><main><h1>Evil laugh and your friends' names</h1><p>Pick one laugh, and for each name the spelling that sounds right (A or B). Then press <b>Copy my choices</b> and paste it in our chat.</p>
<h2>Evil laugh</h2><section>{laughs}</section><h2>Names</h2>{names}</main><div class="bar"><button id="c">Copy my choices</button></div><script>
document.getElementById('c').onclick=async()=>{{const v=n=>(document.querySelector('input[name="'+n+'"]:checked')||{{}}).value||'?';
 const out=['laugh: '+v('laugh')].concat([...document.querySelectorAll('section[data-k]')].map(s=>s.dataset.k+': '+v(s.dataset.k)+(s.querySelector('.note').value?' - '+s.querySelector('.note').value:''))).join('\\n');
 try{{await navigator.clipboard.writeText(out);document.getElementById('c').textContent='Copied!';}}catch(e){{prompt('Copy this:',out);}}}};
</script></body></html>""")
    print("wrote", f"{OUT}/audition.html")

def all_names(spell):
    """spell: key -> spoken text. Writes n_<key> (storyteller) and m_<key> (monster) wavs."""
    import torch
    ref, tts = load()
    conds = {}
    for v in "SM":  # analyse each reference voice once instead of on every clip (same output, much faster)
        tts.prepare_conditionals(ref[v], exaggeration=S.GEN[v]["exaggeration"]); conds[v] = tts.conds
    for i, (key, text) in enumerate(spell.items()):
        fid = re.sub("[^a-z0-9]", "_", key)
        for v, pre in (("S", "n"), ("M", "m")):
            p = f"{NOUT}/{pre}_{fid}.wav"
            if os.path.exists(p): continue
            tts.conds = conds[v]; torch.manual_seed(7)
            w = tts.generate(text + ".", **S.GEN[v]).squeeze(0).numpy()
            save(S.fx(S.trim(w, tts.sr), tts.sr, v), p)
        if i % 10 == 0: print(i, key, flush=True)

if __name__ == "__main__":
    if sys.argv[1] == "audition": audition()
    else:
        names = json.load(open("names.json", encoding="utf-8")); spell = {k: v[0] for k, v in names.items()}
        spell.update(json.load(open("spellings.json", encoding="utf-8")) if os.path.exists("spellings.json") else {})
        nums = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split()
        players = {f"player {i}": f"Player {w}" for i, w in enumerate(nums, 1)}
        all_names({**players, **spell})  # "Player N" first: it is spoken for every name that has no clip
