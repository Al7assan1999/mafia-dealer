# Packs the v2.3 narrator into app/assets/audio.js:
#   v_<line>   accepted lines from script.py (out/tmp/<key>.wav), preview name cut off the lines that end before a name
#   v_laugh    the chosen laugh (out/audition/laugh_b.mp3)
#   n_<name>   storyteller name, m_<name> monster name (out/names/*.wav, from names2.py)
# Loudness matches the old clips (-24 LUFS) so the app's playback gain stays the same.
import base64, json, os, re, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LINES, NAMED

TMP = "out/pack"; os.makedirs(TMP, exist_ok=True)
NUM = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split()

def cut_name(path):  # drop everything after the last pause of 0.55 s or more (the appended preview name)
    s, sr = sf.read(path, dtype="float32"); quiet = np.abs(s) < 0.005; need = int(0.55 * sr)
    run, end = 0, None
    for i in range(len(s) - 1, -1, -1):
        run = run + 1 if quiet[i] else 0
        if run >= need and i < len(s) - need: end = i; break
    assert end, path
    out = f"{TMP}/{os.path.basename(path)}"; sf.write(out, s[:end + int(0.05 * sr)], sr); return out

def opus(src, br):
    dst = f"{TMP}/clip.ogg"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", "loudnorm=I=-24:TP=-6:LRA=11", "-ar", "48000", "-ac", "1",
                    "-c:a", "libopus", "-b:a", br, dst], check=True)
    return base64.b64encode(open(dst, "rb").read()).decode()

def norm(s):  # same normalisation as VOX.norm in the app
    s = s.lower().strip(); s = re.sub("[ً-ْـ]", "", s); s = re.sub("[أإآ]", "ا", s).replace("ى", "ي").replace("ة", "ه")
    s = re.sub("[-'’.]", "", s); return re.sub(r"\s+", " ", s)

clips, alias = {}, {}
for key in LINES:
    if key == "laugh": continue
    src = f"out/tmp/{key}.wav"
    clips["v_" + key] = opus(cut_name(src) if key in NAMED else src, "32k")
clips["v_laugh"] = opus("out/audition/laugh_b.mp3", "32k")
names = json.load(open("names.json", encoding="utf-8"))
names.update({f"player {i}": [f"Player {w}", f"لاعب {i}"] for i, w in enumerate(NUM, 1)})
missing = []
# only approved names (spellings.json = the friends he auditioned) + the default "Player N"; other names are shown, not spoken
allowed = set(json.load(open("spellings.json", encoding="utf-8"))) | {k for k in names if k.startswith("player ")}
for key, v in names.items():
    if key not in allowed: continue
    fid = re.sub("[^a-z0-9]", "_", key); n, m = f"out/names/n_{fid}.wav", f"out/names/m_{fid}.wav"
    if not (os.path.exists(n) and os.path.exists(m)): missing.append(key); continue
    clips["n_" + fid], clips["m_" + fid] = opus(n, "24k"), opus(m, "24k")
    for a in [key] + v[1:]: alias[norm(a)] = "n_" + fid
open("../app/assets/audio.js", "w", encoding="utf-8").write(
    "const CLIPS=" + json.dumps(clips, separators=(",", ":")) + ";\nconst NAME_ALIAS=" + json.dumps(alias, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(clips), "clips,", len(alias), "aliases,", os.path.getsize("../app/assets/audio.js") // 1024, "KB;", len(missing), "names not generated yet")
