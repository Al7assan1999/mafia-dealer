import subprocess, os, json, re, base64, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro("kokoro.onnx","voices.bin")
os.makedirs("out",exist_ok=True)
DARK="asetrate=24000*0.90,aresample=48000,atempo=1.03,bass=g=5:f=110,aecho=0.8:0.6:70|140:0.22|0.12,apad=pad_dur=0.35,alimiter=limit=0.95"
BRIGHT="asetrate=24000*0.96,aresample=48000,bass=g=3:f=120,aecho=0.8:0.5:60:0.15,apad=pad_dur=0.3,alimiter=limit=0.95"
LAUGH="asetrate=24000*0.72,aresample=48000,atempo=1.1,bass=g=7:f=100,aecho=0.8:0.7:90|180|270:0.4|0.25|0.15,apad=pad_dur=0.8,alimiter=limit=0.95"
NAME="asetrate=24000*0.90,aresample=48000,atempo=1.03,bass=g=5:f=110,aecho=0.8:0.6:70|140:0.22|0.12,apad=pad_dur=0.25,alimiter=limit=0.95"
def make(key,text,filt,speed=0.88,br="32k",voice="am_onyx"):
    out=f"out/{key}.ogg"
    if os.path.exists(out):return
    s,sr=k.create(text,voice=voice,speed=speed,lang="en-us")
    s=s.astype(np.float32); loud=s[np.abs(s)>0.02]; rms=np.sqrt((loud**2).mean()) if len(loud) else 1
    s=np.clip(s*(0.16/rms),-1,1)
    sf.write("tmp.wav",s,sr)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i","tmp.wav","-af",filt,"-ac","1","-c:a","libopus","-b:a",br,out],check=True)
LINES={
 "welcome":("Welcome to the town... Somewhere among you, the Mafia is hiding. Look at your role... and tell no one.",DARK,0.85),
 "night_1":("Night falls upon the town... Trust no one.",DARK,0.8),
 "night_2":("The sun has set... and the Mafia is hungry.",DARK,0.8),
 "night_3":("Darkness falls... Somewhere among you, a killer is waiting.",DARK,0.8),
 "night_4":("The town sleeps... but evil never does.",DARK,0.8),
 "killed_1":("The sun rises... but not everyone woke up. Last night, the Mafia claimed a victim.",DARK,0.85),
 "killed_2":("A scream echoed through the night... The Mafia has taken one of you.",DARK,0.85),
 "safe_1":("The sun rises... and everyone is still alive! Nobody died last night.",BRIGHT,0.95),
 "safe_2":("Good morning, town! A miracle... nobody died last night!",BRIGHT,0.95),
 "was_citizen":("They were an innocent Citizen.",DARK,0.88),
 "was_doctor":("They were the Doctor.",DARK,0.88),
 "was_detective":("They were the Detective.",DARK,0.88),
 "was_mafia":("They were a member of the Mafia!",DARK,0.9),
 "day":("Discuss among yourselves... and find the Mafia.",DARK,0.88),
 "timeup":("Time is up! Cast your votes.",DARK,0.95),
 "vote_out":("The town has spoken. One of you must leave.",DARK,0.85),
 "vote_none":("The town shows mercy. Nobody is eliminated today.",DARK,0.88),
 "vote_tie":("The vote is tied. Nobody is eliminated today.",DARK,0.88),
 "mafia_win":("The Mafia wins! The town never stood a chance. Your killers were hiding in plain sight.",DARK,0.85),
 "citizens_win":("Justice prevails! The citizens win! The Mafia has been unmasked.",BRIGHT,0.95),
 "night_5":("Close your eyes, town... The night belongs to the Mafia.",DARK,0.8),
 "killed_3":("Dawn breaks over a silent town... Someone did not survive the night.",DARK,0.85),
 "safe_3":("Dawn breaks... and the town breathes again. Everyone survived the night!",BRIGHT,0.95),
 "day_2":("The killer is sitting among you. Talk... and choose wisely.",DARK,0.88),
 "vote_out_2":("The votes are in. The town has chosen its target.",DARK,0.85),
 "saved_1":("The sun rises... The Mafia attacked last night, but the Doctor saved their target.",BRIGHT,0.92),
 "saved_2":("A miracle in the night! The Mafia struck... but the Doctor saved a life.",BRIGHT,0.92),
 "laugh":("Ha! Ha! Ha! Ha! Ha! Ha, ha, ha!",LAUGH,0.9),
}
for key,(t,f,sp) in LINES.items(): make("v_"+key,t,f,sp)
NAMES=json.load(open("names.json"))  # key -> [tts, aliases...]
NUM="one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split()
for i,w in enumerate(NUM,1): NAMES[f"player {i}"]=[f"Player {w}",f"لاعب {i}"]
def norm(s):
    s=s.lower().strip(); s=re.sub("[ً-ْـ]","",s); s=re.sub("[أإآ]","ا",s).replace("ى","ي").replace("ة","ه")
    s=re.sub("[-'’.]","",s); return re.sub(r"\s+"," ",s)
alias={}
for i,(key,v) in enumerate(NAMES.items()):
    fid="n_"+re.sub("[^a-z0-9]","_",key); make(fid,v[0]+".",NAME,0.9,"24k")
    for a in [key]+v[1:]: alias[norm(a)]=fid
    if i%25==0: print(i,key,flush=True)
b=lambda p:base64.b64encode(open(p,"rb").read()).decode()
clips={f[:-4]:b("out/"+f) for f in sorted(os.listdir("out"))}
open("audio.js","w").write("const CLIPS="+json.dumps(clips,separators=(',',':'))+";\nconst NAME_ALIAS="+json.dumps(alias,ensure_ascii=False,separators=(',',':'))+";\n")
print(len(clips),"clips",len(alias),"aliases",os.path.getsize("audio.js"))
