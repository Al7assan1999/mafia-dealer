# Handoff: Mafia Dealer (read this first)

You are continuing work on **Mafia Dealer**, an Android app for the Mafia party game, built for Alhassan and his friends. This file carries over everything from the previous chat. The code is in this folder; the README explains the build and tests.

## Who and how
- Owner: Alhassan (software engineer, Damascus). Plays with friends: Dareer, Halawy, Farouq, Sami, Hokan, Fater, Khaddour.
- He tests every build on real Android phones and reports back. He wants a short plan and approval **before** big changes, then wants the work done end to end.
- Wants realistic, practical answers; not looking for reassurance.
- All narration and sounds must be **English only**. The UI is English and Arabic (toggle).
- Deliver each build as `MafiaDealer.apk` and say what changed and how to test it.

## Current state: v1.9 (versionCode 10), tested and working
- **Pass & Play** (one phone): complete and stable.
- **Play Together** (every player on their own phone, same Wi-Fi or hotspot):
  - Stage 1, connection test: confirmed on real phones, over a phone hotspot and over a third phone's hotspot (the router-like case). Auto-discovery works and is fast; keep the manual address option.
  - Stage 2, lobby and dealing roles: confirmed on real phones.
  - Stage 3, the full game (simultaneous night turns, morning report, secret vote on phones, end screen, history): built and tested in simulation; **real-phone test is pending**.
  - **Stage 4, next:** polish. Night and day colours on player phones, sound cues on player phones (only where they can't reveal roles), smoother reconnection, plus whatever Alhassan reports from the stage 3 test.

## How the app is built (important)
- The previous environment had **no Android SDK**, and Google's Maven and SDK downloads were blocked. So the app is one HTML page (`app/assets/index.html`) in a WebView, and the APK is produced by Python scripts: `build/dexasm.py` (a small Dalvik assembler), `build/app_dex.py` (the native classes), `build/build_apk.py` (manifest, resources, zip, v2 signing).
- If your environment does have the Android SDK or Gradle, you could move to a normal project, but the current pipeline works, so don't switch without a reason.
- Native classes in `app_dex.py`:
  - `MainActivity`: full-screen WebView, keeps the screen on, Back goes to the WebView history. Creating `Net` is wrapped in try/catch so a failure only disables multiplayer.
  - `Voice`: old text-to-speech bridge, no longer used (Alhassan found the phone voice too robotic).
  - `Net`: JS bridge exposing `start(port)`, `put(k,v)`, `take()`, `clear()`, `ip()`, `running()`. Its store and queue are static.
  - `Srv`: HTTP server thread on port 8765. `GET /a?<x>` queues x, `GET /s?<k>` returns the stored value, anything else returns `mafia-dealer`.
- Manifest: INTERNET, ACCESS_WIFI_STATE, VIBRATE, the TTS query, `usesCleartextTraffic=true`, minSdk 24, targetSdk 34, portrait.
- Signing: `signing.pem` (private key + certificate) is **not in the repo**; Alhassan has it. Every build must use it, or updates won't install over the old app and uninstalling wipes the game history. **Bump versionCode and versionName in `build_apk.py` for every release.**
- Verification: `build/verify_apk.py` checks the zip, the v2 signature, the dex (via androguard), the manifest and the resources. androguard's decompiler garbles methods that have try/catch, so check those at instruction level.

## Game design decisions
- Roles: Mafia, Doctor, Detective; Citizens fill the rest automatically. At least 4 players, and Mafia must be fewer than the others.
- Rules (toggles): one-time Mafia skip (counts as used only when the skip actually wins the vote); Mafia can't target the same player two nights in a row; announce who the Doctor saved; decoy turns for Citizens; Doctor can protect themselves; Doctor can't repeat protection; reveal role on elimination; discussion timer.
- Several Mafia: each sees teammates' picks live; the most-picked target wins, and ties are broken at random.
- Suspense reveals: the morning, vote and winner screens show a waiting screen until the narrator says the name.
- History: last 100 finished games. At the end the phone holder marks a game valid or invalid (can be changed later); only valid games count in stats. Quit games aren't logged.
- Stats: ranked by win rate with a 3-game minimum (ties go to more wins). Mafia and Citizen-side records are shown separately. Titles: Best Player, Best Mafia, Best Detective, Best Doctor, Most Killed First.
- Saved player names appear as chips on the setup screen; duplicate names are blocked.
- Multiplayer: the host phone is the table display (narrator, sounds, reveals) and is also a player; its private screens use press-and-hold. Players poll every 0.7 s. The host can continue without offline players. Late joiners are blocked; known players can rejoin and get their role back. Leaving or quitting on the host returns everyone to the room.

## Audio
- Narrator: generated offline with Kokoro TTS (voice `am_onyx`, pitched down, with echo), stored as base64 Opus in `app/assets/audio.js`. Alhassan accepted the voice as "right but not perfect".
- Name clips: about 180 common Arabic and English names plus "Player 1–20" (`voice/names.json`, which includes Arabic-script aliases). His friends' names were added; pronunciation not yet confirmed by him.
- Sound effects are synthesized in code (WebAudio). Real recordings were wanted, but downloads weren't possible. If you can fetch free sounds (Pixabay, Mixkit) or he sends files, swap them in.
- Copyrighted game or movie audio (Dota 2, films) was declined.

## Testing
- Playwright tests: `tests/test7.js` (7 single-phone games plus history and stats), `tests/test9.js` (the two newer rules).
- Multiplayer: run `tests/multiplayer/mock_srv.py`, a byte-for-byte stand-in for the in-app server, then `test_mp.js` (stage 1), `test_s2.js` (dealing), `test_s3.js cit|maf` (full games), `test_s3b.js` (two Mafia and an offline player), `test_lost.js` (reconnect).
- Pitfall: Playwright `text=` selectors match any text containing the words, such as a hint sentence. Use `button:has-text("…")`.
- Bugs already fixed: name clips overwriting each other (each name now has its own file key); the Detective missing their result when acting last (the result now stays visible until the next night).

## Next step
Ask Alhassan for his stage 3 real-phone test results, then do stage 4 with that feedback.
