# Handoff: Mafia Dealer (read this first)

You are continuing work on **Mafia Dealer**, an Android app for the Mafia party game, built for Alhassan and his friends. This file carries over everything from the previous chat. The code is in this folder; the README explains the build and tests.

## Who and how
- Owner: Alhassan (software engineer, Damascus). Plays with friends: Dareer, Halawy, Farouq, Sami, Hokan, Fater, Khaddour.
- He tests every build on real Android phones and reports back. He wants a short plan and approval **before** big changes, then wants the work done end to end.
- Wants realistic, practical answers; not looking for reassurance.
- All narration and sounds must be **English only**. The UI is English and Arabic (toggle).
- Deliver each build as `MafiaDealer.apk` and say what changed and how to test it.

## Current state: v2.8 (versionCode 24), published on the relay
v2.8 = fixes from the 7-hour game night (first batch, online mode):
- **Critical:** players were skipped at night from the second game on. The phone keyed its sent night choice by night number only, so after Play again it thought it had already chosen and re-sent last game's choice, which the host accepted. Now keyed by deal + night (`nkeyN`), cleared on a new deal, and the host checks `o.deal===MP.game.deal`.
- Rejoin: host rejections carry the hello stamp `h`; phones ignore stale rejections still stored on the relay/Net store (they blocked rejoining after "started"/"kicked"). Kicked players may rejoin.
- End of game: every phone gets the recap card (`recap` in mpPriv), players have "Back to lobby" (`MP.endHide`); host end = Play again / Back to lobby. Vote tallies shown to players.
- Log: each night records "Doctor protected X" and "The Mafia did not choose".
- Share = just the code/address (no APK link); Copy buttons (native `Net.copy`, execCommand fallback); codes are selectable.
- Ghost view and night timer work in Same room too; players see the host's rules in the lobby; Rules screen notes that the host's rules count.
- Live table vote in multiplayer (`mpStartVote(true)`, `G.open`, `voteBoard()`).
- New rule `skipVote` (default on): off = skip votes don't count, most-voted player is out.
- Leaving returns to the mode's screen (`MP.lastMode`).
- Test: `tests/multiplayer/test_feedback.js` (19 checks).
## Previous: v2.7.1 (versionCode 23)
**Accounts (v2.7)**, his decisions: username + password; a forgotten password is reset only through the linked Telegram; profile = display name, avatar (10 presets or own photo), favourite role; history keyed by account, names as fallback; single-phone and same-room work without an account; online needs one.
- Relay `Accounts` Durable Object (singleton "global", SQLite tables users/sessions/codes). Passwords PBKDF2-SHA256 100k + salt; sessions are random 32-byte tokens stored as SHA-256; 5 wrong logins lock 15 min; reset/link codes expire in 15 min; a reset signs out other phones.
- API: POST /acc/signup, /acc/login, /acc/profile, /acc/tglink, /acc/logout, /acc/delete, /acc/reset/start, /acc/reset/finish; GET /acc/me, /acc/reset/status; GET /a/<uid> avatar image; POST /tg/<TG_SECRET> Telegram webhook.
- Telegram bot **@MafiaDealer7058bot**; token in `C:/Users/WGN/Desktop/Mafia/tg.key`; Worker secrets TG_TOKEN, TG_SECRET (copy in `relay/.tgsecret`), TG_BOT. Webhook set with setWebhook. Local dev uses `relay/.dev.vars` (no token, so no messages are sent).
- Online rooms: phones connect with `&tok=`; the Room asks Accounts to verify and stamps uid/uname/uav on every message (phones can't claim another account). Wi-Fi hello carries uid unverified.
- App: `S.acct={tok,u}`, `me()`, account/forgot screens, avatar in the corner, `avatarHtml()`, name from profile (`needName`), games store `acc[]` per seat, stats use `seatKey()` (account first). Native `Chrome` WebChromeClient + `onActivityResult` make `<input type=file>` open the photo picker; photos are cropped to 192 px JPEG on the phone.
- Tests: `relay/test_accounts.mjs [base] [secret]` (28), `tests/multiplayer/test_accounts_app.js [ws] [secret]` (16); online tests sign up via a `signup()` helper.

## Previous: v2.6 (versionCode 21)
- v2.5.x: home spacing, smoother intro, share room code/Wi-Fi address from host and player lobbies. v2.6: role rules + warnings (see Game design). Test: `test_rules.js`.
- Next under discussion: sign-up/sign-in with verification, cloud profiles, online mode requiring a profile.
- v2.4.1: "Check for updates" (Settings > More, and the version line on Home); the automatic check runs on every app start.
- v2.5: in-app updates. Update downloads the APK inside the app with a progress bar (`doUpdate`), hands it to native `Net.saveApk(b64)` (cache/update.apk), then `Net.install()` opens Android's "Update this app?" via the `Apk` ContentProvider (`content://com.mafiadealer.app.apk/update.apk`, read-only, granted per intent). Needs REQUEST_INSTALL_PACKAGES; Android asks once to allow installs from Mafia Dealer. Falls back to the browser link on any failure. Silent updates are impossible for sideloaded apps. Test: `tests/multiplayer/test_inapp.js`.
v2.4 added (all from his 13-point list, 2026-11-15):
- **Settings split**: Game rules screen (`rulesView`: presets Classic/Beginner/Custom, rules grouped Night / Day and reveals / Online games) opened from a summary card on setup and in the host lobby; Settings screen (`settingsView`, gear icon in the corner: Look, Sound volumes, When you host, Group history, More).
- **Volumes** `S.vol.voice` / `S.vol.sfx` (0-1) replace the old on/off rules; effects go through their own gain bus `E`.
- **Recommended Mafia** = round(players/4), one-tap Apply on setup.
- **Online player screen**: header shows the room or phase, no fake latency online, Leave asks mid-game, discussion and night countdowns on every phone (host publishes the end time, phones count locally), Share room code (native `Net.share` share sheet).
- **Host controls** (`S.host`): buzz limit (mute after N, host can unmute), kick (`'lobby'` or `'any'`; mid-game kick = elimination written to the log; kicked ids can't rejoin the room).
- **Online rules**: night timer `S.rules.nightT` (skips unfinished turns, `G.nightEnd`), ghost view `S.rules.ghost` (dead players get all roles).
- **Recap card** on the end screen (screenshot-friendly: winner, player of the game via `mvp()`, roles, timeline). Games now also record `ev.kills` (night victims) and `ev.outs` (voted out).
- **Player profiles**: tap a leaderboard row (`profileView`: win rate, best role, as Mafia / Citizens side, killed most by, wins by role, moments, recent form).
- **Intro**: 3 cards on first launch (skipped when `navigator.webdriver`, i.e. test browsers), replay in Settings.
- **Transitions**: screen fade + sheet slide; small labels ~1 px bigger.
- **Shared group history**: relay `Group` Durable Object (`GET /g/<CODE>`, `POST /add`, `POST /edit`), 8-char codes, `x-dev` = per-phone secret `S.devKey`, owner stored as SHA-256; only the uploading phone can edit/delete. App: `LOG()` returns `S.gcache` in a group, else `S.log`; `gSync()` uploads unsent games (`S.gsent`) and pulls; joining uploads the phone's old games (dupes skipped).
- Update check now runs on every app start.
- Tests: `tests/multiplayer/test_v24.js [wss://…]` (32 checks). The live relay holds a few test groups/rooms from these runs (harmless).
- v2.1 Play Online was confirmed by Alhassan on 4 real devices (2026-11-15).
- v2.2 = brand-new UI with two switchable themes (Home -> Theme pill, saved in `S.theme`):
  - **Neon** (default): glassy cards, pink-orange gradients, Readex Pro (Arabic + Latin).
  - **Noir**: black / bone / blood red, Special Elite typewriter headings (El Messiri for Arabic), IBM Plex Sans Arabic body, paper "CLASSIFIED" role card.
  - Everything is CSS tokens on `<html data-theme>`; role colours come from `RCS[theme]`. Fonts are bundled in `app/assets/fonts/` (OFL licenses included); `build_apk.py` now packs asset subfolders and stores woff2 uncompressed.
  - Play Together = name + two tiles (`#mode-wifi`, `#mode-online`); Same room (`wifiView`) and Online (`onlineView`) are separate screens. Back from host/join returns to the right one.
  - `design/mockups.py` rebuilds the 3-direction comparison page (he chose Noir + Neon, not Moonlit).
- **Pass & Play** (one phone): complete and stable.
- **Play Together** (every player on their own phone, same Wi-Fi or hotspot):
  - Stage 1, connection test: confirmed on real phones, over a phone hotspot and over a third phone's hotspot (the router-like case). Auto-discovery works and is fast; keep the manual address option.
  - Stage 2, lobby and dealing roles: confirmed on real phones.
  - Stage 3, the full game (simultaneous night turns, morning report, secret vote on phones, end screen, history): built and tested in simulation; **real-phone test is pending**.
  - Stage 3 real-phone status: Alhassan only tried connecting two phones (host owns the hotspot, host on another player's hotspot, home router). No full game yet.
  - **Stage 4, build 1 = v2.0 (done, waiting for his test):** reconnection.
    - Host snapshots room + game to localStorage `mafiaDealer.mp` on every publish; "Resume hosted game" on home and Play Together. Quitting/closing the room clears it.
    - Players remember the room (`mafiaDealer.join`) and rejoin automatically on app start; Leave, a closed room or a blocked join clears it.
    - A player unreachable for 8 s rescans the subnet for a room with the same host name (handles a new host address).
    - Native `Keep` foreground service (type connectedDevice) with a partial wake lock and Wi-Fi lock while hosting, started via `Net.keep(on)`; Android 8+ only.
- **Play Online (v2.1, done, waiting for his test)**: third mode, friends anywhere over the internet (talk on a WhatsApp/Discord call).
  - Relay: `relay/` (Cloudflare Worker + one SQLite Durable Object per 6-digit room code), deployed at `wss://mafia-relay.mafiadealer.workers.dev` on his Cloudflare account (free plan; workers.dev subdomain `mafiadealer`). Never runs game logic.
  - Protocol: host `?role=host&key=<24-char secret>` sends `{t:'put',k,v}` / `{t:'clear'}` / `{t:'bc',v}`; players `?role=p&id=<id>` send URL-encoded action JSON (same as LAN `/a?`). Relay delivers each `p_<id>` only to that player, queues actions while the host is away, tells players `{host:0|1}`, and auto-answers "ping" with "pong" (no wake, not billed). Values are stored only when changed.
  - App: host code talks to `HN` = native `Net` (Wi-Fi) or `onlineNet()` (same put/take/clear). Online players read pushed state instead of polling. Every `NARR.*` call on an online host is broadcast so narration plays on all phones. 7 s pong watchdog replaces silently dead sockets. Host snapshot and player auto-rejoin carry the room code. The relay address is built in (`RELAY`); the settings field was removed at his request, but `S.relay` still overrides it (the tests use it to point at a local `wrangler dev`). Moving the relay means a new build.
  - Deploy: from `relay/`, `CLOUDFLARE_API_TOKEN` from `C:/Users/WGN/Desktop/Mafia/cf.key` and `CLOUDFLARE_ACCOUNT_ID` from `relay/.account` (gitignored), then `npx wrangler deploy`. Local: `npx wrangler dev --port 8787`.
  - Free-plan budget: WebSocket messages count 20:1 as requests and only incoming ones count; host-side and relay-side de-duplication keep a game far below 100k requests/day.
  - **Stage 4, build 2 = v2.2 (after online is confirmed on phones):** UI redesign (2-3 mockups first, keep screens/flow, bundled Arabic-capable fonts, night/day colours on player phones), offline voice regeneration, role-neutral sound cues on player phones.

## How the app is built (important)
- **Google's dl.google.com blocks Alhassan's location (Syria)**: the Android SDK, Google Maven, adb, emulator and Flutter-for-Android can't be downloaded. A Kotlin move was approved, then dropped for this reason (2026-11-15). Don't route around the block (VPN, mirrors, cloud runners). Maven Central, PyPI, npm, GitHub and Hugging Face work.
- So the app is one HTML page (`app/assets/index.html`) in a WebView, and the APK is produced by Python scripts: `build/dexasm.py` (a small Dalvik assembler; supports `sget` and `if-lt` too), `build/app_dex.py` (the native classes), `build/build_apk.py` (manifest, resources, zip, v2 signing).
- Native classes in `app_dex.py`:
  - `MainActivity`: full-screen WebView, keeps the screen on, Back goes to the WebView history. Creating `Net` is wrapped in try/catch so a failure only disables multiplayer.
  - `Voice`: old text-to-speech bridge, no longer used (Alhassan found the phone voice too robotic).
  - `Net`: JS bridge exposing `start(port)`, `put(k,v)`, `take()`, `clear()`, `ip()`, `running()`, `keep(on)`. Its store and queue are static.
  - `Keep`: foreground service while hosting (notification, partial wake lock, Wi-Fi lock); stops when the app is swiped away.
  - `Srv`: HTTP server thread on port 8765. `GET /a?<x>` queues x, `GET /s?<k>` returns the stored value, anything else returns `mafia-dealer`.
- Manifest: INTERNET, ACCESS_WIFI_STATE, CHANGE_WIFI_STATE, WAKE_LOCK, FOREGROUND_SERVICE(_CONNECTED_DEVICE), VIBRATE, the `Keep` service, the TTS query, `usesCleartextTraffic=true`, minSdk 24, targetSdk 34, portrait.
- Signing: the key is `C:/Users/WGN/Desktop/Mafia/mafia-dealer-signing-key.pem` on his laptop (outside the repo; cert CN=Mafia Dealer, SHA-256 e813d5ac...646471). Build from `build/` with `python build_apk.py out/MafiaDealer.apk ../app/assets icon.png ../../../mafia-dealer-signing-key.pem`; the script refuses to run without the key instead of generating a new one. Every build must use it, or updates won't install over the old app and uninstalling wipes the game history. **Bump versionCode and versionName in `build_apk.py` for every release.**
- Verification: `build/verify_apk.py` checks the zip, the v2 signature, the dex (via androguard), the manifest and the resources. androguard's decompiler garbles methods that have try/catch, so check those at instruction level.

## Releasing (v2.3+)
1. Bump `APP` in `app/assets/index.html`. 2. `cd build && python build_apk.py out/MafiaDealer.apk ../app/assets icon.png ../../../mafia-dealer-signing-key.pem && python verify_apk.py out/MafiaDealer.apk`.
3. `cd relay && python publish.py "what changed"`: copies the APK and a `version.json` into `relay/public/` and deploys. The APK is then public at `https://mafia-relay.mafiadealer.workers.dev/MafiaDealer.apk`.
- Apps from v2.3 check `version.json` on start (at most every 6 h; quiet offline) and show "Update available" on Home; `Net.open(url)` (native, added in v2.3) hands the link to the browser. Lobby shows "old version" next to players behind the host, and players with an older app than the host see a warning (hello carries `v`, room carries `hv`).
- Play Protect warns on every sideloaded install (unknown developer/app, background permissions). Publishing on Play is not possible from Syria; Google's planned developer verification for sideloaded apps may matter later.

## Game design decisions
- Roles (v2.6, his rules): exactly 1 Doctor; at most 1 Detective and only with 2+ Mafia; Mafia must be at least 2 fewer than everyone else (Mafia <= (players-2)/2); Citizens fill the rest; at least 4 players. All enforced in `fixCounts()`/`deckErr()`.
- Every leave/remove/delete asks first (v2.6): close room, leave room (lobby too), header arrow and phone Back in a room (`inRoom()`/`askLeaveRoom()`/`leaveNow()`), removing a player in setup; kick, discard, delete game, clear history, quit, leave group already did.
- Rules (toggles): one-time Mafia skip (counts as used only when the skip actually wins the vote); Mafia can't target the same player two nights in a row; announce who the Doctor saved; decoy turns for Citizens; Doctor can protect themselves; Doctor can't repeat protection; reveal role on elimination; discussion timer.
- Several Mafia: each sees teammates' picks live; the most-picked target wins, and ties are broken at random.
- Suspense reveals: the morning, vote and winner screens show a waiting screen until the narrator says the name.
- History: last 100 finished games. At the end the phone holder marks a game valid or invalid (can be changed later); only valid games count in stats. Quit games aren't logged.
- Stats: ranked by win rate with a 3-game minimum (ties go to more wins). Mafia and Citizen-side records are shown separately. Titles: Best Player, Best Mafia, Best Detective, Best Doctor, Most Killed First.
- Saved player names appear as chips on the setup screen; duplicate names are blocked.
- Rematch (v2.3): after marking a game valid/invalid, Play again deals new roles to the same players at once (single phone: same names; host: same phones in the room). "Change players" / "Back to room" still available.
- Multiplayer: the host phone is the table display (narrator, sounds, reveals) and is also a player; its private screens use press-and-hold. Players poll every 0.7 s. The host can continue without offline players. Late joiners are blocked; known players can rejoin and get their role back. Leaving or quitting on the host returns everyone to the room.

## Audio
- Narrator (v2.3): rewritten script with two characters, generated on the laptop CPU with Chatterbox (`voice/script.py`), each phrase separate and joined with real pauses (he complained the old voice ignored commas):
  - S = fairy-tale storyteller (Chatterbox copying Kokoro `bm_george`, light hall echo); M = monster (copying Kokoro `am_onyx`, pitched down with a sub-octave and dark echo).
  - He accepted all 28 lines except the laugh; laugh version B ("Heh heh heh... Ha ha ha ha ha!", lighter FX) chosen.
  - Only approved names are spoken (he said not to generate the full list): the 8 friends in `spellings.json` + default "Player 1-20". Other names show on screen without a voice; `pack.py` filters to that list. To add a friend: audition with `names2.py`, add to `spellings.json`, generate, pack.
  - Names exist in both voices: `n_<key>` storyteller, `m_<key>` monster. `VOX.name(n,1)` picks the monster one (deaths, Mafia win); saves, votes and Citizens win use the storyteller.
  - Friends' approved spellings are in `voice/spellings.json` (he preferred syllable spellings like "Ha-la-wee", "Khad-door"; "Al Hassan" and "Fahter" kept).
  - `voice/pack.py` builds `audio.js`, cutting the preview name ("Halawy") off the lines that end before a name, at -24 LUFS like the old clips.
- Name clips: about 180 common Arabic and English names plus "Player 1–20" (`voice/names.json`, which includes Arabic-script aliases). His friends' names were added; pronunciation not yet confirmed by him.
- Sound effects are synthesized in code (WebAudio). Pixabay blocks downloads from here; Freesound works but needs his free account's API key.
- **ElevenLabs is geo-blocked for Syria** (sanctions list on geo-restriction.elevenlabs.io). He has a free key at `C:/Users/WGN/Desktop/Mafia/elevenlabs.key`, 0 credits used. He asked to route it through WireGuard; declined. Regenerate voices offline: Kokoro (phoneme input to fix names one by one) or Chatterbox on CPU (no GPU on his i7-8550U laptop).
- He reported the name clips sound very bad.
- Copyrighted game or movie audio (Dota 2, films) was declined.

## Testing
- Playwright tests: `tests/test7.js` (7 single-phone games plus history and stats), `tests/test9.js` (the two newer rules).
- Multiplayer (run from `tests/multiplayer`; each spawns `mock_srv.py`, a byte-for-byte stand-in for the in-app server, except `test_mp.js` which needs it started by hand): `test_s2.js` (dealing; app restart now rejoins by itself), `test_s3.js cit|maf` (full games), `test_s3b.js` (two Mafia and an offline player), `test_lost.js` (reconnect), `test_drop.js` (stage 4: vote while offline, app restart, stale host address, host killed and resumed), `test_update.js` (rematch both modes, update banner, old-version warnings), `test_online.js [wss://…]` (full online game through the relay: codes, private roles, narration on every phone, dead socket, host resume, wrong code; default local wrangler dev).
- Relay protocol: `node relay/test_relay.mjs [https://…]` (13 checks).
- Windows: `python3` is the Store stub, so tests spawn `python` on win32. Playwright is installed with `npm install --no-save playwright`.
- Pitfall: Playwright `text=` selectors match any text containing the words, such as a hint sentence. Use `button:has-text("…")`.
- Bugs already fixed: name clips overwriting each other (each name now has its own file key); the Detective missing their result when acting last (the result now stays visible until the next night).

## Next step
Get Alhassan's real-phone results for v2.1: an online game over mobile data in different places, plus the v2.0 Wi-Fi checks (Wi-Fi off/on, host app closed and resumed, hosting notification). Then the voice lines (`voice/script.py`, monster/storyteller, preview page with Accept/Change) and the design mockups for v2.2.
