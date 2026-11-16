# Mafia Dealer

An Android app that replaces the dealer in the Mafia party game. Built without the Android SDK: the game is a single HTML page shown in a WebView, and a few Python scripts produce the APK directly.

## Modes
- **Pass & Play**: one phone, passed around the table.
- **Play Together**: every player uses their own phone on the same Wi-Fi or hotspot. The host phone runs a small HTTP server inside the app; the other phones find it automatically.
- **Play Online**: friends anywhere join with a 6-digit room code through a small Cloudflare relay (`relay/`). The host phone still runs the game; narration plays on every phone.

## Features
- Roles: Mafia, Doctor, Detective, Citizen (auto-filled).
- Rules: one-time Mafia skip, no repeat target, announce Doctor saves, decoy turns for Citizens, Doctor self-protect / no repeat, reveal role on elimination, discussion timer.
- Recorded English narrator in two characters (fairy-tale storyteller, monster) with ~200 player names in both voices, procedural sound effects, suspense reveals.
- Game history (last 100 games, filters), player stats and titles, valid/invalid marking, How to Play guide (English and Arabic).

## Layout
| Path | What it is |
| --- | --- |
| `app/assets/index.html` | The whole game: UI, rules engine, sounds, multiplayer client and host |
| `app/assets/audio.js` | Narrator clips and name clips in two voices (base64 Opus), packed by `voice/pack.py` |
| `build/dexasm.py` | Minimal Dalvik assembler (writes `classes.dex`) |
| `build/app_dex.py` | Native classes: `MainActivity` (WebView), `Voice` (TTS bridge, unused now), `Net` (JS bridge), `Srv` (HTTP server thread) |
| `build/build_apk.py` | Writes the binary manifest, `resources.arsc`, zips and v2-signs the APK |
| `build/verify_apk.py` | Independent checks of the APK (zip, v2 signature, dex via androguard, manifest, resources) |
| `tests/` | Playwright tests (single-phone game) |
| `tests/multiplayer/` | `mock_srv.py` mirrors the in-app server; tests simulate a host and several phones |
| `relay/` | Online relay: Cloudflare Worker + Durable Object per room (`npx wrangler deploy`), `test_relay.mjs` |
| `voice/script.py` | v2.1+ narrator script (storyteller and monster voices) and preview page, Chatterbox on CPU |

## Build
```bash
pip install cryptography androguard
cd build
python3 build_apk.py out/MafiaDealer.apk ../app/assets icon.png C:/Users/WGN/Desktop/Mafia/mafia-dealer-signing-key.pem
python3 verify_apk.py out/MafiaDealer.apk
```
`signing.pem` is the release key (private key + certificate). **It is not in this repo.** Use the same key for every build, or Android will refuse to install the update over the old app (and uninstalling loses the game history). If the file is missing, the script stops instead of making a new key.

## Release
```bash
cd relay && npm install          # once
python publish.py "what changed"   # keys: $MAFIA_KEYS or Desktop/Mafia (cf.key); needs relay/.account
```
Installed apps see the update via version.json and install it in-app.

## Regenerate the narrator
Runs on the laptop CPU with Chatterbox (voice copied from synthetic Kokoro references, no real person), models from Hugging Face.
```bash
cd voice
python -m venv .venv && .venv/Scripts/python -m pip install chatterbox-tts kokoro-onnx soundfile huggingface_hub "setuptools<81"
.venv/Scripts/python script.py            # the 28 narrator lines -> out/lines/preview.html (Accept/Change page)
.venv/Scripts/python names2.py audition   # laugh versions + friends' names in 2 spellings
.venv/Scripts/python names2.py all        # every name in both voices (n_ storyteller, m_ monster)
.venv/Scripts/python pack.py              # writes ../app/assets/audio.js
```
Approved name spellings live in `spellings.json`; add names to `names.json` as `"key": ["Spoken spelling", "alias", "عربي"]`.
Needs `../../../hf.key` (a Hugging Face read token) for the model downloads.

## Tests
```bash
npm install playwright && npx playwright install chromium
node tests/test7.js                         # 7 single-phone games + history/stats
cd tests/multiplayer && python3 mock_srv.py &   # stand-in for the in-app server on port 8765
node test_s3.js cit                         # full multiplayer game, Citizens win
node test_s3.js maf                         # Mafia win
```

## Multiplayer protocol
Host server (port 8765): `GET /a?<json>` queues a player message, `GET /s?<key>` returns a stored value (`room`, `p_<playerId>`), anything else returns `mafia-dealer`. The host page reads the queue with `Net.take()` and publishes each player's private state with `Net.put()`. Players poll every 0.7 s.
