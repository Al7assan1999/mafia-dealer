# Release: put the built APK and its version.json on the relay, then deploy.
#   python publish.py ["what changed"]        (run from relay/, after build_apk.py)
# Every installed app checks https://mafia-relay.mafiadealer.workers.dev/version.json and offers the update.
import json, os, re, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BASE = "https://mafia-relay.mafiadealer.workers.dev"
code, name = re.search(r"const APP=\{code:(\d+),name:'([^']+)'\}", open(os.path.join(ROOT, "app/assets/index.html"), encoding="utf-8").read()).groups()
apk = os.path.join(ROOT, "build/out/MafiaDealer.apk")
assert os.path.exists(apk), "build the APK first (build/build_apk.py)"
shutil.copy(apk, os.path.join(HERE, "public/MafiaDealer.apk"))
json.dump({"code": int(code), "name": name, "url": f"{BASE}/MafiaDealer.apk", "notes": sys.argv[1] if len(sys.argv) > 1 else ""},
          open(os.path.join(HERE, "public/version.json"), "w", encoding="utf-8"), ensure_ascii=False)
keys = os.path.join(ROOT, "../..")  # cf.key lives next to the signing key, outside the repo
env = dict(os.environ, CLOUDFLARE_API_TOKEN=open(os.path.join(keys, "cf.key"), encoding="utf-8-sig").read().strip(),
           CLOUDFLARE_ACCOUNT_ID=open(os.path.join(HERE, ".account")).read().strip())
subprocess.run("npx wrangler deploy", shell=True, cwd=HERE, env=env, check=True)
print(f"published v{name} ({code}) -> {BASE}/version.json")
