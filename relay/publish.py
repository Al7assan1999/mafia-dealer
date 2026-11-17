# Release: put the built APK and its version.json on the relay, then deploy.
#   python publish.py "first change" "second change" ...   (run from relay/, after build_apk.py; one bullet per argument)
# releases.json (in the repo) keeps every release's bullets; version.json gets this release's bullets and the recent ones.
# Every installed app checks https://mafia-relay.mafiadealer.workers.dev/version.json and offers the update.
import datetime, json, os, re, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASE = "https://mafia-relay.mafiadealer.workers.dev"
code, name = re.search(r"const APP=\{code:(\d+),name:'([^']+)'\}", open(os.path.join(ROOT, "app/assets/index.html"), encoding="utf-8").read()).groups()
apk = os.path.join(ROOT, "build/out/MafiaDealer.apk")
assert os.path.exists(apk), "build the APK first (build/build_apk.py)"
shutil.copy(apk, os.path.join(HERE, "public/MafiaDealer.apk"))
bullets = [a.strip() for a in sys.argv[1:] if a.strip()]
rel_path = os.path.join(HERE, "releases.json")
rel = json.load(open(rel_path, encoding="utf-8")) if os.path.exists(rel_path) else []
rel = [r for r in rel if r["code"] != int(code)]
rel.insert(0, {"code": int(code), "name": name, "date": datetime.date.today().isoformat(), "notes": bullets})
json.dump(rel, open(rel_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
# "notes" stays one line for apps before v2.14; "bullets" and "history" are for the What's new screen
json.dump({"code": int(code), "name": name, "url": f"{BASE}/MafiaDealer.apk", "notes": " \u00b7 ".join(bullets), "bullets": bullets, "history": rel[:8]},
          open(os.path.join(HERE, "public/version.json"), "w", encoding="utf-8"), ensure_ascii=False)
# cf.key lives next to the signing key, outside the repo: $MAFIA_KEYS, two folders up (old layout) or Desktop\Mafia
keys = next(d for d in [os.environ.get("MAFIA_KEYS", ""), os.path.join(ROOT, "../.."), os.path.expanduser("~/Desktop/Mafia")]
            if d and os.path.exists(os.path.join(d, "cf.key")))
env = dict(os.environ, CLOUDFLARE_API_TOKEN=open(os.path.join(keys, "cf.key"), encoding="utf-8-sig").read().strip(),
           CLOUDFLARE_ACCOUNT_ID=open(os.path.join(HERE, ".account")).read().strip())
subprocess.run("npx wrangler deploy", shell=True, cwd=HERE, env=env, check=True)
print(f"published v{name} ({code}) -> {BASE}/version.json")
